/**
 * Streaming service utilities
 * Handles real-time streaming functionality including stream management,
 * authentication, broadcaster/viewer coordination, and trending content
 */

const streams = new Map();
const trendingNews = new Map(); // Map to store trending news items
const liveActivityByRegion = new Map(); // Map to store live activity by region

/**
 * Creates a new live stream
 * 
 * @param {Object} streamData - Data for the new stream
 * @param {number} streamData.newsId - ID of the news item
 * @param {number} streamData.userId - ID of the broadcaster
 * @param {string} streamData.title - Stream title
 * @param {Object} streamData.metadata - Additional stream metadata
 * @returns {Object} Created stream data
 */
function createStream(streamData) {
  const streamId = streamData.newsId.toString();
  const stream = {
    id: streamId,
    newsId: streamData.newsId,
    broadcasters: new Set([streamData.userId]), // Can support multiple broadcasters
    viewers: new Set(),
    status: 'active',
    startedAt: new Date(),
    title: streamData.title,
    metadata: streamData.metadata || {},
    isAnonymous: !!streamData.isAnonymous, // Track if this is an anonymous broadcast
    comments: [],
    reactions: []
  };
  
  streams.set(streamId, stream);
  return getPublicStreamData(stream);
}

/**
 * Ends an active stream
 * 
 * @param {string} streamId - ID of the stream to end
 * @param {number} userId - ID of the user ending the stream (must be broadcaster)
 * @returns {boolean} Whether the stream was successfully ended
 */
function endStream(streamId, userId) {
  const stream = streams.get(streamId);
  if (!stream) return false;
  
  // Verify broadcaster permission
  if (!stream.broadcasters.has(userId)) return false;
  
  stream.status = 'ended';
  stream.endedAt = new Date();
  streams.set(streamId, stream);
  
  return true;
}

/**
 * Adds a viewer to a stream
 * 
 * @param {string} streamId - ID of the stream
 * @param {string} viewerId - ID of the viewer (socket ID or user ID)
 * @returns {boolean} Whether the viewer was added successfully
 */
function addViewer(streamId, viewerId) {
  const stream = streams.get(streamId);
  if (!stream || stream.status !== 'active') return false;
  
  stream.viewers.add(viewerId);
  streams.set(streamId, stream);
  return true;
}

/**
 * Removes a viewer from a stream
 * 
 * @param {string} streamId - ID of the stream
 * @param {string} viewerId - ID of the viewer to remove
 * @returns {boolean} Whether the viewer was removed successfully
 */
function removeViewer(streamId, viewerId) {
  const stream = streams.get(streamId);
  if (!stream) return false;
  
  const result = stream.viewers.delete(viewerId);
  streams.set(streamId, stream);
  return result;
}

/**
 * Adds a comment to a stream
 * 
 * @param {string} streamId - ID of the stream
 * @param {Object} commentData - Comment data
 * @returns {Object|null} The added comment or null if stream not found
 */
function addComment(streamId, commentData) {
  const stream = streams.get(streamId);
  if (!stream) return null;
  
  const comment = {
    id: Date.now(),
    ...commentData,
    timestamp: new Date()
  };
  
  stream.comments.push(comment);
  streams.set(streamId, stream);
  return comment;
}

/**
 * Adds a reaction to a stream
 * 
 * @param {string} streamId - ID of the stream
 * @param {Object} reactionData - Reaction data
 * @returns {Object|null} The added reaction or null if stream not found
 */
function addReaction(streamId, reactionData) {
  const stream = streams.get(streamId);
  if (!stream) return null;
  
  const reaction = {
    id: Date.now(),
    ...reactionData,
    timestamp: new Date()
  };
  
  stream.reactions.push(reaction);
  streams.set(streamId, stream);
  return reaction;
}

/**
 * Gets active streams, optionally filtered by location
 * 
 * @param {Object} [locationFilter] - Optional location filter
 * @param {number} locationFilter.latitude - Latitude to filter by
 * @param {number} locationFilter.longitude - Longitude to filter by
 * @param {number} locationFilter.radiusKm - Radius in kilometers
 * @returns {Array} Array of active streams
 */
function getActiveStreams(locationFilter) {
  const activeStreams = [];
  
  streams.forEach(stream => {
    if (stream.status === 'active') {
      activeStreams.push(getPublicStreamData(stream));
    }
  });
  
  // Filter by location if provided
  if (locationFilter) {
    // This would filter streams based on distance
    // For simplicity, we're skipping actual implementation
    return activeStreams;
  }
  
  return activeStreams;
}

/**
 * Gets data for a specific stream
 * 
 * @param {string} streamId - ID of the stream
 * @returns {Object|null} Stream data or null if not found
 */
function getStream(streamId) {
  const stream = streams.get(streamId);
  if (!stream) return null;
  
  return getPublicStreamData(stream);
}

/**
 * Gets streamlined public data for a stream
 * Handles anonymization if the stream is marked anonymous
 * 
 * @param {Object} stream - Internal stream object
 * @returns {Object} Public stream data
 */
function getPublicStreamData(stream) {
  // Create the base public stream data
  const publicData = {
    id: stream.id,
    newsId: stream.newsId,
    status: stream.status,
    startedAt: stream.startedAt,
    endedAt: stream.endedAt,
    title: stream.title,
    metadata: { ...stream.metadata },
    viewerCount: stream.viewers.size,
    broadcastersCount: stream.broadcasters.size,
    commentsCount: stream.comments.length,
    reactionsCount: stream.reactions.length,
    isAnonymous: !!stream.isAnonymous
  };
  
  // If this is an anonymous stream, adjust the metadata to protect broadcaster identity
  if (stream.isAnonymous) {
    // Ensure we don't expose any potential PII in metadata
    // Remove any broadcaster specific information while keeping broadcast settings
    const { username, userId, userLocation, profilePic, ...safeMetadata } = publicData.metadata;
    
    // Add anonymous indicator
    publicData.metadata = {
      ...safeMetadata,
      broadcasterName: 'Anonymous',
      anonymousBroadcast: true
    };
  }
  
  return publicData;
}

/**
 * Track a news item's activity for trending calculations
 * 
 * @param {string} newsId - ID of the news item
 * @param {string} activityType - Type of activity ('view', 'like', 'comment', 'share')
 * @param {Object} options - Additional options
 * @param {Object} options.location - Location data for regional tracking
 * @param {string} options.userId - ID of the user performing the action
 * @returns {Object} Updated trending data for this news item
 */
function trackNewsActivity(newsId, activityType, options = {}) {
  if (!newsId) return null;
  
  const id = newsId.toString();
  const now = Date.now();
  const timeWindows = [
    { name: 'last15m', duration: 15 * 60 * 1000 },
    { name: 'lastHour', duration: 60 * 60 * 1000 },
    { name: 'last24h', duration: 24 * 60 * 60 * 1000 }
  ];
  
  // Initialize or get existing trend data
  const trendData = trendingNews.get(id) || {
    newsId: id,
    activities: [],
    scores: {
      total: 0,
      last15m: 0,
      lastHour: 0,
      last24h: 0
    },
    activityCounts: {
      view: 0,
      like: 0,
      comment: 0,
      share: 0
    },
    regions: new Map()
  };
  
  // Add this activity
  const activity = {
    type: activityType,
    timestamp: now,
    userId: options.userId,
    location: options.location
  };
  
  trendData.activities.push(activity);
  trendData.activityCounts[activityType] = (trendData.activityCounts[activityType] || 0) + 1;
  
  // Update regional tracking if location is provided
  if (options.location) {
    const { latitude, longitude, regionName } = options.location;
    if (regionName) {
      const regionCount = trendData.regions.get(regionName) || 0;
      trendData.regions.set(regionName, regionCount + 1);
      
      // Update global region tracking
      const regionActivity = liveActivityByRegion.get(regionName) || {
        count: 0,
        newsItems: new Set(),
        lastActivity: null
      };
      
      regionActivity.count++;
      regionActivity.newsItems.add(id);
      regionActivity.lastActivity = now;
      liveActivityByRegion.set(regionName, regionActivity);
    }
  }
  
  // Calculate time-based scores
  let totalScore = 0;
  
  // Apply activity type weights
  const weights = {
    view: 1,
    like: 5,
    comment: 10,
    share: 15
  };
  
  const activityScore = weights[activityType] || 1;
  
  // Update scores for each time window
  timeWindows.forEach(window => {
    const cutoff = now - window.duration;
    const recentActivities = trendData.activities.filter(a => a.timestamp >= cutoff);
    const windowScore = recentActivities.reduce((score, act) => 
      score + (weights[act.type] || 1), 0);
    
    trendData.scores[window.name] = windowScore;
    
    // Recent activities contribute more to total score
    if (window.name === 'last15m') {
      totalScore += windowScore * 3;
    } else if (window.name === 'lastHour') {
      totalScore += windowScore * 2;
    } else {
      totalScore += windowScore;
    }
  });
  
  trendData.scores.total = totalScore;
  trendingNews.set(id, trendData);
  
  // Clean up old activities (only keep last 24 hours)
  const dayAgo = now - (24 * 60 * 60 * 1000);
  trendData.activities = trendData.activities.filter(a => a.timestamp >= dayAgo);
  
  return {
    newsId: id,
    scores: trendData.scores,
    activityCounts: trendData.activityCounts,
    regionActivity: Array.from(trendData.regions.entries()).map(([name, count]) => ({ name, count }))
  };
}

/**
 * Get trending news items
 * 
 * @param {Object} options - Options for filtering trending news
 * @param {string} options.timeframe - Timeframe to use for scoring ('last15m', 'lastHour', 'last24h', 'total')
 * @param {string} options.region - Filter by region name
 * @param {number} options.limit - Maximum number of items to return
 * @returns {Array} Array of trending news items with scores
 */
function getTrendingNews(options = {}) {
  const { timeframe = 'total', region, limit = 10 } = options;
  const validTimeframes = ['last15m', 'lastHour', 'last24h', 'total'];
  const scoreKey = validTimeframes.includes(timeframe) ? timeframe : 'total';
  
  // Convert Map to Array for sorting
  let trending = Array.from(trendingNews.values());
  
  // Filter by region if specified
  if (region) {
    trending = trending.filter(item => 
      item.regions && item.regions.has(region)
    );
  }
  
  // Sort by selected timeframe score
  trending.sort((a, b) => b.scores[scoreKey] - a.scores[scoreKey]);
  
  // Take only the requested number of items
  trending = trending.slice(0, limit);
  
  // Format the output
  return trending.map(item => ({
    newsId: item.newsId,
    score: item.scores[scoreKey],
    activityCounts: item.activityCounts,
    regionActivity: Array.from(item.regions || []).map(([name, count]) => ({ name, count }))
  }));
}

/**
 * Get regions with active news
 * 
 * @param {Object} options - Options for filtering regions
 * @param {number} options.limit - Maximum number of regions to return
 * @param {number} options.activeWithinMinutes - Only include regions with activity within this many minutes
 * @returns {Array} Array of active regions with news counts
 */
function getActiveRegions(options = {}) {
  const { limit = 10, activeWithinMinutes = 60 } = options;
  const now = Date.now();
  const cutoff = now - (activeWithinMinutes * 60 * 1000);
  
  // Filter regions with recent activity
  const activeRegions = Array.from(liveActivityByRegion.entries())
    .filter(([_, data]) => data.lastActivity >= cutoff)
    .map(([name, data]) => ({
      name,
      activityCount: data.count,
      newsItemsCount: data.newsItems.size,
      lastActivity: data.lastActivity
    }))
    .sort((a, b) => b.activityCount - a.activityCount)
    .slice(0, limit);
  
  return activeRegions;
}

module.exports = {
  createStream,
  endStream,
  addViewer,
  removeViewer,
  addComment,
  addReaction,
  getActiveStreams,
  getStream,
  trackNewsActivity,
  getTrendingNews,
  getActiveRegions
};