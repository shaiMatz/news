/**
 * Streaming service utilities
 * Handles real-time streaming functionality including stream management,
 * authentication, and broadcaster/viewer coordination
 */

const streams = new Map();

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
 * 
 * @param {Object} stream - Internal stream object
 * @returns {Object} Public stream data
 */
function getPublicStreamData(stream) {
  return {
    id: stream.id,
    newsId: stream.newsId,
    status: stream.status,
    startedAt: stream.startedAt,
    endedAt: stream.endedAt,
    title: stream.title,
    metadata: stream.metadata,
    viewerCount: stream.viewers.size,
    broadcastersCount: stream.broadcasters.size,
    commentsCount: stream.comments.length,
    reactionsCount: stream.reactions.length
  };
}

module.exports = {
  createStream,
  endStream,
  addViewer,
  removeViewer,
  addComment,
  addReaction,
  getActiveStreams,
  getStream
};