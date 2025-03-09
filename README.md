# NewsGeo - Hyper-Local News Streaming Platform

NewsGeo is a cutting-edge news streaming platform that delivers hyper-local, personalized content with advanced real-time capabilities and intelligent user engagement.

## Features

### Core Features
- **Location-Based News**: Find news relevant to your specific location
- **Live News Streaming**: Watch real-time news broadcasts 
- **Social Following**: Follow users to see their news content
- **Interactive News Feed**: Like, comment, and share news items
- **Real-Time Notifications**: Stay updated with instant alerts
- **Trending News**: Discover popular content in your region
- **Personalized Experience**: Content tailored to your interests

### User Experience
- **Freemium Model**: Free access to 10 news items, login required for additional features
- **Responsive Design**: Consistent experience across all devices
- **Dark/Light Themes**: Customize your viewing experience
- **Offline Capabilities**: Access some content without an internet connection

## Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
```
npm install
```

### Running the Server
To start the server, use the following command:
```
node server/index.js
```
or use the Replit workflow "NewsGeo Server"

### Running the Client
The application has two client options:

#### Web Client
The web client can be accessed directly in the browser once the server is running:
1. Start the server as described above
2. Open a web browser and navigate to:
   - If running locally: http://localhost:5000
   - If on Replit: The generated Replit URL

#### Mobile Client (React Native)
To run the React Native mobile client:
1. Make sure the server is running
2. Start the React Native development server:
```
cd src
npm start
```
3. Use Expo to run the app on a simulator or physical device by scanning the QR code

## Usage

### Authentication
- **Login/Register**: Access your account or create a new one from the authentication screen
- **Profile**: View and edit your user profile

### News Consumption
- **Home Feed**: Browse the latest news from your area
- **Trending**: See what's popular right now
- **Following Feed**: View content from users you follow

### Social Features
- **Following/Followers**: Manage your social connections
- **User Profiles**: View other users' activity and content
- **Comments**: Engage in discussions about news items

### Content Creation
- **Upload News**: Share news content with others
- **Stream Live**: Broadcast events in real-time

## Technical Stack

- **Frontend**: React Native (mobile) and React (web)
- **Backend**: Express.js
- **Real-time Communication**: WebSockets/Socket.IO
- **State Management**: Context API
- **Storage**: In-memory database (development)

## Project Structure

```
├── server/           # Backend code
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   ├── auth.js       # Authentication
│   ├── index.js      # Server entry point
│   └── storage.js    # Data storage
├── shared/           # Shared code
├── src/              # Frontend code
│   ├── components/   # UI components
│   ├── contexts/     # Context providers
│   ├── navigation/   # App navigation
│   ├── screens/      # App screens
│   ├── services/     # API services
│   ├── utils/        # Utility functions
│   └── App.js        # App entry point
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with ❤️ using Replit
- Icon and design assets created for the NewsGeo platform