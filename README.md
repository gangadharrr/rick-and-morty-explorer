# Rick and Morty Universe Explorer

![Rick and Morty Logo](https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Rick_and_Morty.svg/1200px-Rick_and_Morty.svg.png)

An interactive website to explore characters from the Rick and Morty universe. Built using HTML, CSS, and vanilla JavaScript with the official [Rick and Morty API](https://rickandmortyapi.com/).

## Live Demo

🔴 [View Live Demo](https://gangadharrr.github.io/rick-and-morty-explorer)

## Features

- **Character Cards**: Visually appealing cards displaying character information
- **Pagination**: Navigate through all characters with an intuitive pagination system
- **Search Functionality**: Find specific characters by name
- **Filtering**: Filter characters by status (Alive, Dead, Unknown) and gender
- **Detailed View**: Click on any character to see detailed information and episode appearances
- **Advanced Caching System**: Stores API responses locally for faster loading and reduced API calls
- **Offline Mode Detection**: Shows notifications when using cached data while offline
- **Connection Status Indicator**: Visual indicator showing online/offline status
- **Responsive Design**: Fully responsive layout that works on all devices
- **Portal Animations**: Cool Rick and Morty themed animations and styling

## Technologies Used

- HTML5
- CSS3 (with animations and transitions)
- JavaScript (ES6+)
- Rick and Morty API (REST)
- LocalStorage for persistent caching
- Font Awesome icons
- Google Fonts

## Deployment Instructions

### Option 1: GitHub Pages

1. Fork this repository
2. Go to repository Settings > Pages
3. Set Source to "main" branch
4. Save and wait for deployment to complete
5. Visit your site at `https://gangadharrr.github.io/rick-and-morty-explorer`

### Option 2: Deploy Locally

1. Clone the repository
   ```
   git clone https://github.com/gangadharrr/rick-and-morty-explorer.git
   ```
2. Navigate to the project directory
   ```
   cd rick-and-morty-explorer
   ```
3. Open `index.html` in your browser

## Caching System

The website implements an advanced caching system to improve performance and reduce API calls:

### Features:
- **In-memory Cache**: Stores API responses in memory for immediate access
- **LocalStorage Persistence**: Saves cache between browser sessions
- **Automatic Expiration**: Cache entries expire after 1 hour to ensure data freshness
- **Cache Statistics**: Tracks the number of cached items
- **Manual Control**: Users can clear the cache with the "Clear Cache" button
- **Storage Quota Management**: Automatically handles storage limitations
- **Cache Categories**:
  - Character listings (search results and filtered pages)
  - Individual character details
  - Episode information

### Benefits:
- Faster page loads after initial visit
- Reduced API usage
- Works offline for previously viewed content
- Smoother user experience with instant data access

## Offline Mode

The website includes comprehensive offline mode functionality:

### Features:
- **Automatic Detection**: Detects when the device goes offline
- **Visual Indicators**:
  - Connection status indicator in the header
  - Offline notification banner
  - Cached content indicators
- **Graceful Degradation**:
  - Uses cached data when offline
  - Shows appropriate error messages for uncached content
  - Provides placeholder data for unavailable episodes
- **Reconnection Handling**:
  - Detects when connection is restored
  - Offers to refresh the page for latest data
  - Shows toast notifications for connection changes

### User Experience:
- Seamless transition between online and offline modes
- Clear visual feedback about connection status
- Ability to continue browsing previously loaded content while offline
- Transparent indicators showing when cached data is being displayed

## Credits

- Character data provided by [The Rick and Morty API](https://rickandmortyapi.com/)
- Icons from [Font Awesome](https://fontawesome.com/)
- Fonts from [Google Fonts](https://fonts.google.com/)

## License

This project is open source and available under the [MIT License](LICENSE).

---

Wubba Lubba Dub Dub! Enjoy exploring the multiverse!