const session = require('express-session');
const MemoryStore = require('memorystore')(session);

/**
 * In-memory storage implementation
 * This provides a simple data storage solution for the application
 */
class InMemoryStorage {
  constructor() {
    // Initialize in-memory data structures
    this.users = [];
    this.news = [];
    this.comments = [];
    this.notifications = [];
    this.nextId = {
      users: 1,
      news: 1,
      comments: 1,
      notifications: 1
    };
    
    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Seed with some initial data
    this.seedData();
  }

  // User-related methods
  async createUser(userData) {
    const id = this.nextId.users++;
    const newUser = {
      id,
      username: userData.username,
      email: userData.email,
      password: userData.password,
      createdAt: userData.createdAt || new Date(),
      settings: {
        locationTracking: true,
        notifications: true,
        contentLanguage: 'English'
      },
      stats: {
        uploads: 0,
        likes: 0,
        views: 0
      }
    };
    
    this.users.push(newUser);
    return { ...newUser };
  }

  async getUserById(id) {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username) {
    return this.users.find(user => user.username === username);
  }

  async getUserByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  async updateUserProfile(userId, profileData) {
    const userIndex = this.users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    // Update only allowed fields
    const updatedUser = {
      ...this.users[userIndex],
      ...profileData
    };
    
    this.users[userIndex] = updatedUser;
    
    // Return a copy without password
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async updateUserSettings(userId, settings) {
    const userIndex = this.users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    this.users[userIndex].settings = {
      ...this.users[userIndex].settings,
      ...settings
    };
    
    return this.users[userIndex].settings;
  }

  // News-related methods
  async createNews(newsData, authorId) {
    const id = this.nextId.news++;
    const newNews = {
      id,
      title: newsData.title,
      description: newsData.description,
      shortDescription: newsData.description.substring(0, 150) + (newsData.description.length > 150 ? '...' : ''),
      videoUrl: newsData.videoUrl,
      thumbnail: newsData.thumbnail || 'https://via.placeholder.com/300x200',
      location: newsData.location,
      coordinates: newsData.coordinates,
      author: this.getUserById(authorId).then(user => user.username),
      authorId,
      publishedAt: new Date(),
      isLive: newsData.isLive || false,
      likes: 0,
      views: 0,
      likedBy: []
    };
    
    this.news.push(newNews);
    
    // Update author stats
    const userIndex = this.users.findIndex(user => user.id === authorId);
    if (userIndex !== -1) {
      this.users[userIndex].stats.uploads++;
    }
    
    return newNews;
  }

  async getAllNews(limit = null) {
    // Sort by newest first
    let sortedNews = [...this.news].sort((a, b) => 
      new Date(b.publishedAt) - new Date(a.publishedAt)
    );
    
    if (limit) {
      sortedNews = sortedNews.slice(0, limit);
    }
    
    return sortedNews;
  }

  async getNewsByLocation(latitude, longitude, radiusKm = 50) {
    // Filter news by location within given radius
    // This is a simplified implementation
    return this.news.filter(news => {
      if (!news.coordinates || !latitude || !longitude) {
        return false;
      }
      
      // Calculate distance between coordinates (simplified)
      const distance = Math.sqrt(
        Math.pow(news.coordinates.latitude - latitude, 2) + 
        Math.pow(news.coordinates.longitude - longitude, 2)
      ) * 111; // Rough conversion to km
      
      return distance <= radiusKm;
    }).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }

  async getNewsById(id) {
    return this.news.find(news => news.id === id);
  }

  async getUserNews(userId) {
    return this.news.filter(news => news.authorId === userId);
  }

  async getUserLikedNews(userId) {
    return this.news.filter(news => news.likedBy.includes(userId));
  }

  async likeNews(newsId, userId) {
    const newsIndex = this.news.findIndex(news => news.id === newsId);
    
    if (newsIndex === -1) {
      throw new Error('News not found');
    }
    
    const alreadyLiked = this.news[newsIndex].likedBy.includes(userId);
    
    if (alreadyLiked) {
      // Unlike
      this.news[newsIndex].likedBy = this.news[newsIndex].likedBy.filter(id => id !== userId);
      this.news[newsIndex].likes--;
      
      // Update user stats
      const userIndex = this.users.findIndex(user => user.id === userId);
      if (userIndex !== -1 && this.users[userIndex].stats.likes > 0) {
        this.users[userIndex].stats.likes--;
      }
    } else {
      // Like
      this.news[newsIndex].likedBy.push(userId);
      this.news[newsIndex].likes++;
      
      // Update user stats
      const userIndex = this.users.findIndex(user => user.id === userId);
      if (userIndex !== -1) {
        this.users[userIndex].stats.likes++;
      }
      
      // Create a notification for the news author
      if (this.news[newsIndex].authorId !== userId) {
        this.createNotification({
          userId: this.news[newsIndex].authorId,
          type: 'like',
          title: 'Someone liked your news',
          message: `Your news "${this.news[newsIndex].title}" was liked`,
          referenceId: newsId,
          referenceType: 'news'
        });
      }
    }
    
    return {
      id: this.news[newsIndex].id,
      likes: this.news[newsIndex].likes,
      liked: !alreadyLiked
    };
  }

  async incrementNewsViews(newsId) {
    const newsIndex = this.news.findIndex(news => news.id === newsId);
    
    if (newsIndex === -1) {
      throw new Error('News not found');
    }
    
    this.news[newsIndex].views++;
    
    // Update author stats
    const authorId = this.news[newsIndex].authorId;
    const userIndex = this.users.findIndex(user => user.id === authorId);
    if (userIndex !== -1) {
      this.users[userIndex].stats.views++;
    }
    
    return {
      id: newsId,
      views: this.news[newsIndex].views
    };
  }

  // Comment-related methods
  async createComment(commentData) {
    const id = this.nextId.comments++;
    const newComment = {
      id,
      newsId: commentData.newsId,
      authorId: commentData.authorId,
      author: commentData.author,
      text: commentData.text,
      createdAt: new Date()
    };
    
    this.comments.push(newComment);
    
    // Create a notification for the news author
    const news = await this.getNewsById(commentData.newsId);
    if (news && news.authorId !== commentData.authorId) {
      this.createNotification({
        userId: news.authorId,
        type: 'comment',
        title: 'New comment on your news',
        message: `Someone commented on your news "${news.title}"`,
        referenceId: commentData.newsId,
        referenceType: 'news'
      });
    }
    
    return newComment;
  }

  async getCommentsByNewsId(newsId) {
    return this.comments
      .filter(comment => comment.newsId === newsId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Notification-related methods
  async createNotification(notificationData) {
    const id = this.nextId.notifications++;
    const newNotification = {
      id,
      userId: notificationData.userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      referenceId: notificationData.referenceId,
      referenceType: notificationData.referenceType,
      read: false,
      createdAt: new Date()
    };
    
    this.notifications.push(newNotification);
    return newNotification;
  }

  async getUserNotifications(userId) {
    return this.notifications
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async markNotificationAsRead(id) {
    const notificationIndex = this.notifications.findIndex(notification => notification.id === id);
    
    if (notificationIndex === -1) {
      throw new Error('Notification not found');
    }
    
    this.notifications[notificationIndex].read = true;
    return this.notifications[notificationIndex];
  }

  async markAllNotificationsAsRead(userId) {
    this.notifications
      .filter(notification => notification.userId === userId && !notification.read)
      .forEach(notification => {
        notification.read = true;
      });
    
    return true;
  }

  // Initialize with some sample data
  seedData() {
    // Create a few locations
    const locations = [
      { name: 'New York', latitude: 40.7128, longitude: -74.0060 },
      { name: 'Los Angeles', latitude: 34.0522, longitude: -118.2437 },
      { name: 'Chicago', latitude: 41.8781, longitude: -87.6298 },
      { name: 'Houston', latitude: 29.7604, longitude: -95.3698 },
      { name: 'Phoenix', latitude: 33.4484, longitude: -112.0740 }
    ];
    
    // Set of video URLs for sample news
    const videoUrls = [
      'https://example.com/video1.mp4',
      'https://example.com/video2.mp4',
      'https://example.com/video3.mp4',
      'https://example.com/video4.mp4',
      'https://example.com/video5.mp4'
    ];
    
    // News topics
    const newsTitles = [
      'Breaking: Major Development in Downtown Area',
      'Local Community Comes Together for Annual Festival',
      'Tech Company Announces New Headquarters',
      'Weather Alert: Storm System Approaching',
      'City Council Approves New Infrastructure Project',
      'Sports Team Celebrates Championship Win',
      'New Restaurant Opening Creates Buzz',
      'Education System Implements New Program',
      'Healthcare Initiative Launches in the Region',
      'Environmental Conservation Efforts Show Results',
      'Traffic Update: Major Road Construction Begins',
      'Economic Report Shows Growth in Local Businesses'
    ];
    
    // News descriptions
    const newsDescriptions = [
      'A major development is underway in the downtown area, promising to transform the cityscape and create numerous job opportunities for local residents. The project includes residential buildings, office spaces, and recreational areas.',
      'The local community has come together for the annual cultural festival, celebrating diversity through music, food, and art. Visitors from neighboring cities are expected to attend this weekend-long event.',
      'A leading tech company has announced plans to establish its new headquarters in the city, which is expected to bring thousands of jobs and boost the local economy. Construction will begin next month.',
      'Meteorologists are warning of an approaching storm system that could bring heavy rainfall and strong winds to the area. Residents are advised to take necessary precautions and stay updated on the latest forecasts.',
      'The city council has approved a new infrastructure project that will address longstanding issues with public transportation and road conditions. The project is scheduled to be completed within 18 months.',
      'The local sports team is celebrating their championship win with a parade through downtown. Fans are gathering from all around the region to join in the festivities and show their support.',
      'A highly anticipated restaurant is opening its doors next week, featuring cuisine from an internationally renowned chef. Reservations have already been booked for the next two months.',
      'The education department is implementing a new program designed to enhance student learning experiences through technology integration and practical skill development. Training for teachers begins this week.',
      'A comprehensive healthcare initiative has been launched in the region, aimed at improving access to medical services for underserved communities. Mobile clinics will be deployed to remote areas.',
      'Recent environmental conservation efforts in the region have shown positive results, with increased wildlife populations and improved water quality in local rivers and lakes. Volunteers continue to monitor progress.',
      'A major road construction project is set to begin next Monday, which will cause traffic diversions for the next several weeks. Authorities have issued alternative route recommendations.',
      'According to a recent economic report, local businesses have experienced significant growth in the past quarter, indicating a positive trend for the city\'s economy. Small business startups have increased by 15%.'
    ];
    
    // Create news items
    for (let i = 0; i < 15; i++) {
      const locationIndex = i % locations.length;
      const location = locations[locationIndex];
      const titleIndex = i % newsTitles.length;
      const descIndex = i % newsDescriptions.length;
      
      this.news.push({
        id: this.nextId.news++,
        title: newsTitles[titleIndex],
        description: newsDescriptions[descIndex],
        shortDescription: newsDescriptions[descIndex].substring(0, 150) + '...',
        videoUrl: videoUrls[i % videoUrls.length],
        thumbnail: `https://via.placeholder.com/300x200?text=News+${i+1}`,
        location: location.name,
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude
        },
        author: 'System',
        authorId: 0,
        publishedAt: new Date(Date.now() - (i * 3600000)), // Hours ago
        isLive: i < 3, // First 3 are live
        likes: Math.floor(Math.random() * 50),
        views: Math.floor(Math.random() * 500),
        likedBy: []
      });
    }
  }
}

/**
 * Setup storage for the application
 * 
 * @returns {InMemoryStorage} Storage instance
 */
function setupStorage() {
  return new InMemoryStorage();
}

module.exports = { setupStorage };
