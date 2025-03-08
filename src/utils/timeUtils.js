/**
 * Format a date as a relative time string (e.g., "2 hours ago")
 * 
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted relative time
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  
  // Convert to seconds
  const diffSecs = Math.floor(diffMs / 1000);
  
  // Less than a minute
  if (diffSecs < 60) {
    return 'Just now';
  }
  
  // Less than an hour
  if (diffSecs < 3600) {
    const mins = Math.floor(diffSecs / 60);
    return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Less than a day
  if (diffSecs < 86400) {
    const hours = Math.floor(diffSecs / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Less than a week
  if (diffSecs < 604800) {
    const days = Math.floor(diffSecs / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  
  // Format as date
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return past.toLocaleDateString(undefined, options);
}

/**
 * Format a time in 12-hour format
 * 
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted time (e.g., "3:45 PM")
 */
export function formatTime(date) {
  if (!date) return '';
  
  const dateObj = new Date(date);
  return dateObj.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get the current time of day period (morning, afternoon, evening, night)
 * 
 * @returns {string} Time of day period
 */
export function getTimeOfDay() {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'morning';
  } else if (hour >= 12 && hour < 17) {
    return 'afternoon';
  } else if (hour >= 17 && hour < 21) {
    return 'evening';
  } else {
    return 'night';
  }
}
