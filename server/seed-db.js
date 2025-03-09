/**
 * Database Seed Script
 * This script adds demo data to the NewsGeo PostgreSQL database
 */

// Import required modules
const bcrypt = require('bcrypt');
const { sequelize } = require('./database/config');
const { User, News, Comment, Follow, NewsLike } = require('./database/models');

// Function to hash passwords
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Main seed function
async function seedDatabase() {
  console.log('Starting database seed process...');
  
  try {
    // Clear existing data
    // Note: We use force: true in development only - this will drop tables and recreate them
    console.log('Synchronizing database models...');
    await sequelize.sync({ force: true });
    
    console.log('Creating demo users...');
    
    // Create demo users
    const users = await User.bulkCreate([
      {
        username: 'sarah_reporter',
        email: 'sarah@example.com',
        password: await hashPassword('password123'),
        settings: {
          locationTracking: true,
          notifications: true,
          contentLanguage: 'English'
        }
      },
      {
        username: 'alex_journalist',
        email: 'alex@example.com',
        password: await hashPassword('password123'),
        settings: {
          locationTracking: true,
          notifications: true,
          contentLanguage: 'English'
        }
      },
      {
        username: 'jamie_local',
        email: 'jamie@example.com',
        password: await hashPassword('password123'),
        settings: {
          locationTracking: true,
          notifications: true,
          contentLanguage: 'English'
        }
      }
    ]);
    
    console.log('Creating demo news articles...');
    
    // Create demo news articles
    const newsArticles = await News.bulkCreate([
      {
        title: 'New Park Opening Downtown',
        description: 'A beautiful new park has opened in the downtown area, featuring walking trails, a playground, and a small lake. The mayor attended the ribbon-cutting ceremony this morning, declaring it "a green oasis in our urban environment." Local residents have already begun enjoying the space, with many bringing picnics and setting up recreational activities throughout the day.',
        shortDescription: 'Downtown gets a new green space for the community',
        location: 'Downtown',
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
        authorId: users[0].id,
        isLive: false,
        thumbnail: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
      },
      {
        title: 'Local Restaurant Wins Award',
        description: 'Popular local restaurant "The Seaside Grill" has won the prestigious Culinary Excellence Award for the third year in a row. Chef Maria Rodriguez credits the win to her team\'s dedication to using fresh, locally-sourced ingredients and creating innovative fusion dishes. "We\'re honored to receive this recognition and will continue striving to provide our customers with exceptional dining experiences," Rodriguez said in her acceptance speech.',
        shortDescription: 'The Seaside Grill recognized for culinary excellence',
        location: 'Waterfront District',
        coordinates: { latitude: 37.8199, longitude: -122.4783 },
        authorId: users[1].id,
        isLive: false,
        thumbnail: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
      },
      {
        title: 'Community Clean-up Initiative Launches',
        description: 'A new community initiative called "GreenStreets" launched today with the goal of organizing regular neighborhood clean-up events. The program, led by local activist Terry Williams, aims to reduce litter, improve recycling efforts, and beautify public spaces. "We want to empower residents to take ownership of their environment," said Williams. The first clean-up event attracted over 50 volunteers who collected more than 200 pounds of trash from local parks and streets.',
        shortDescription: 'Residents join forces for cleaner neighborhoods',
        location: 'Riverside',
        coordinates: { latitude: 37.7879, longitude: -122.4074 },
        authorId: users[2].id,
        isLive: false,
        thumbnail: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
      },
      {
        title: 'Live: Traffic Update on Main Highway',
        description: 'Currently reporting live from the Main Highway where an accident has caused significant delays. Authorities are on the scene directing traffic. Commuters are advised to seek alternate routes for the next few hours. Emergency services have responded quickly and there are no serious injuries reported at this time. Stay tuned for updates as the situation develops.',
        shortDescription: 'Accident causing delays - seek alternate routes',
        location: 'Main Highway Junction',
        coordinates: { latitude: 37.7575, longitude: -122.4369 },
        authorId: users[0].id,
        isLive: true,
        thumbnail: 'https://images.unsplash.com/photo-1566011127797-4c1a40ea1b10?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
      }
    ]);
    
    console.log('Creating demo comments...');
    
    // Create demo comments
    await Comment.bulkCreate([
      {
        newsId: newsArticles[0].id,
        authorId: users[1].id,
        author: users[1].username,
        text: 'This park looks amazing! Can\'t wait to visit this weekend.'
      },
      {
        newsId: newsArticles[0].id,
        authorId: users[2].id,
        author: users[2].username,
        text: 'Great to see more green spaces in our city. We need more initiatives like this.'
      },
      {
        newsId: newsArticles[1].id,
        authorId: users[0].id,
        author: users[0].username,
        text: 'I ate at The Seaside Grill last week and the food was incredible. Well deserved award!'
      },
      {
        newsId: newsArticles[2].id,
        authorId: users[1].id,
        author: users[1].username,
        text: 'Just signed up to volunteer for the next clean-up event. Looking forward to helping out!'
      }
    ]);
    
    console.log('Setting up follow relationships...');
    
    // Create follow relationships
    await Follow.bulkCreate([
      {
        followerId: users[0].id,
        targetUserId: users[1].id
      },
      {
        followerId: users[0].id,
        targetUserId: users[2].id
      },
      {
        followerId: users[1].id,
        targetUserId: users[0].id
      },
      {
        followerId: users[2].id,
        targetUserId: users[0].id
      }
    ]);
    
    console.log('Adding likes to news articles...');
    
    // Add likes to news articles
    await NewsLike.bulkCreate([
      {
        userId: users[1].id,
        newsId: newsArticles[0].id
      },
      {
        userId: users[2].id,
        newsId: newsArticles[0].id
      },
      {
        userId: users[0].id,
        newsId: newsArticles[1].id
      },
      {
        userId: users[1].id,
        newsId: newsArticles[2].id
      }
    ]);
    
    // Update like counts on news articles
    await News.update(
      { likes: 2 },
      { where: { id: newsArticles[0].id } }
    );
    
    await News.update(
      { likes: 1 },
      { where: { id: newsArticles[1].id } }
    );
    
    await News.update(
      { likes: 1 },
      { where: { id: newsArticles[2].id } }
    );
    
    console.log('Database seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Export for use in other files
module.exports = seedDatabase;

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding complete. Press Ctrl+C to exit.');
    })
    .catch(error => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}