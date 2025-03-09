/**
 * Utility functions for social sharing functionality
 */

/**
 * Generate a shareable URL for a news item
 * 
 * @param {string} newsId - ID of the news item
 * @param {Object} options - Additional options for the URL
 * @returns {string} Shareable URL
 */
export function generateShareableUrl(newsId, options = {}) {
  // Get the base URL (domain) - detect if we're in development or production
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://newsgeo.app' 
    : window.location.origin;
  
  // Create URL object for proper formatting
  const url = new URL(`${baseUrl}/news/${newsId}`);
  
  // Add any additional query parameters
  if (options.source) {
    url.searchParams.append('utm_source', options.source);
  }
  if (options.medium) {
    url.searchParams.append('utm_medium', options.medium);
  }
  if (options.campaign) {
    url.searchParams.append('utm_campaign', options.campaign);
  }
  
  return url.toString();
}

/**
 * Format the share text for a news item
 * 
 * @param {Object} newsItem - The news item to share
 * @param {Object} options - Formatting options
 * @returns {string} Formatted share text
 */
export function formatShareText(newsItem, options = {}) {
  const { title, location } = newsItem;
  const maxLength = options.maxLength || 280; // Twitter-like length limit
  
  let text = title || 'Breaking News';
  
  // Add location if available
  if (location && !options.excludeLocation) {
    text += ` from ${location}`;
  }
  
  // Add custom message if provided
  if (options.message) {
    text += ` - ${options.message}`;
  }
  
  // Add hashtags if provided
  if (options.hashtags && Array.isArray(options.hashtags) && options.hashtags.length > 0) {
    const hashtagString = options.hashtags.map(tag => `#${tag}`).join(' ');
    text += ` ${hashtagString}`;
  }
  
  // Truncate text if it exceeds max length
  if (text.length > maxLength) {
    text = text.substring(0, maxLength - 3) + '...';
  }
  
  return text;
}

/**
 * Share content using the Web Share API if available, 
 * or fall back to a custom sharing interface
 * 
 * @param {Object} shareData - Data to share
 * @param {string} shareData.title - Title of the content
 * @param {string} shareData.text - Text description
 * @param {string} shareData.url - URL to share
 * @returns {Promise<boolean>} Whether sharing was successful
 */
export async function shareContent(shareData) {
  try {
    // Try using the Web Share API first (modern browsers & mobile)
    if (navigator.share) {
      await navigator.share(shareData);
      return true;
    } else {
      // Fall back to clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        await navigator.clipboard.writeText(shareText);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error sharing content:', error);
    return false;
  }
}

/**
 * Get available share targets for the current platform
 * 
 * @returns {Array<Object>} Array of share targets with id, name, and icon
 */
export function getShareTargets() {
  // Define standard social media platforms
  const standardTargets = [
    { id: 'twitter', name: 'Twitter', icon: 'twitter' },
    { id: 'facebook', name: 'Facebook', icon: 'facebook' },
    { id: 'linkedin', name: 'LinkedIn', icon: 'linkedin' },
    { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp' },
    { id: 'telegram', name: 'Telegram', icon: 'telegram' },
    { id: 'email', name: 'Email', icon: 'mail' },
    { id: 'copy', name: 'Copy Link', icon: 'copy' }
  ];
  
  return standardTargets;
}

/**
 * Share to a specific platform
 * 
 * @param {string} platform - Platform ID to share to
 * @param {Object} shareData - Data to share
 * @returns {Promise<boolean>} Whether sharing was successful
 */
export async function shareToPlatform(platform, shareData) {
  const { title, text, url } = shareData;
  
  // Encode components for safety
  const encodedTitle = encodeURIComponent(title || '');
  const encodedText = encodeURIComponent(text || '');
  const encodedUrl = encodeURIComponent(url || '');
  
  let shareUrl = '';
  
  switch (platform) {
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
      break;
      
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      break;
      
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      break;
      
    case 'whatsapp':
      shareUrl = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
      break;
      
    case 'telegram':
      shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
      break;
      
    case 'email':
      shareUrl = `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`;
      break;
      
    case 'copy':
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(url);
          return true;
        } catch (error) {
          console.error('Failed to copy to clipboard:', error);
          return false;
        }
      }
      return false;
  }
  
  if (shareUrl) {
    // Open in a new window
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    return true;
  }
  
  return false;
}

/**
 * Track a share event for analytics
 * 
 * @param {string} platform - Platform shared to
 * @param {string} newsId - ID of the news item
 * @param {Object} userData - User data for tracking
 */
export function trackShareEvent(platform, newsId, userData = {}) {
  try {
    // Log the share event
    console.log(`Content shared: ${newsId} on ${platform}`);
    
    // Here you would typically send to your analytics service
    // This is just a placeholder for the actual implementation
    const eventData = {
      event: 'share',
      platform,
      contentId: newsId,
      timestamp: new Date().toISOString(),
      userId: userData.id || 'anonymous',
      location: userData.location
    };
    
    // Send to API
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    }).catch(err => console.error('Failed to track share event:', err));
    
  } catch (error) {
    console.error('Error tracking share event:', error);
  }
}