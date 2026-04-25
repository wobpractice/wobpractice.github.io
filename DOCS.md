# WOB Practice Website

A comprehensive typing practice application focused on word-based prompts with multiple game modes, customization options, and performance tracking.

## Project Overview

WOB Practice Website is a web-based typing trainer that challenges users to type words containing specific letter combinations (prompts). The application features multiple game modes, adaptive difficulty, performance analytics, and extensive customization options.

## Core Features

### Game Modes

#### Standard Modes
- **Normal Mode**: Random prompt selection with configurable difficulty ranges
- **All Prompts**: Sequential practice through all prompts within user's difficulty range
- **Favorites Random**: Random selection from favorited prompts
- **Favorites Sequential**: Sequential practice through favorited prompts
- **Priority Mode**: Focus on marked priority prompts
- **Struggle Mode**: Adaptive difficulty based on performance metrics

#### Regen Modes (Regeneration System)
- **Regen Random Letter**: Type words containing prompt + random letter
- **Regen Regular**: Collect hearts by using letters until counts reach zero
- **Regen Ranked**: Advanced regen with 3 starting hearts and increased difficulty

#### SN Mode (Sub-8)
- **SN Mode**: Exclusively uses 2-3 letter prompts with 8 or fewer solutions
- Weighted selection favoring prompts with more solutions
- Displays solution count instead of difficulty percentage

### Input Features
- **Smart Input Conversion**: Space → hyphen, Period → apostrophe
- **Ctrl+Backspace**: Clear entire input instantly
- **Real-time Preview**: Live character-by-character feedback
- **Auto-solve**: Intelligent word suggestion system

### Customization Options

#### Configuration Settings
- **Difficulty Range**: Min/max difficulty filtering (0-100%)
- **Sort Options**: Random, alphabetical, length-based, rarity-based
- **Prompt Length Weights**: Adjustable weighting for 2-letter and 3-letter prompts
- **Theme System**: Multiple color themes with automatic persistence

#### Prompt Management
- **Favorites System**: Star and organize preferred prompts
- **Priority Marking**: Mark important prompts for focused practice
- **Custom Wordlists**: Create and manage personalized word collections
- **Export Functionality**: Download wordlists as TXT files

### Performance Tracking

#### Statistics
- **Session Stats**: Real-time performance metrics
- **Historical Data**: Long-term progress tracking
- **Struggle Analysis**: Automatic identification of challenging prompts
- **Success Rates**: Detailed accuracy and speed measurements

#### Data Persistence
- **Local Storage**: All settings and progress saved automatically
- **Export/Import**: Backup and restore user data
- **Cross-session Continuity**: Seamless practice experience

## Technical Specifications

### Frontend Stack
- **HTML5**: Semantic markup structure
- **CSS3**: Modern styling with CSS variables for theming
- **Vanilla JavaScript**: ES6+ modules, no external dependencies

### Data Management
- **Word Database**: 286,594 words from comprehensive dictionary
- **4,933 unique prompts** with difficulty ratings
- **2,122 SN prompts** (2-3 letters, ≤8 solutions)
- **Storage**: Browser localStorage for persistence

### File Structure
```
├── index.html          # Main application interface
├── css/
│   └── style.css       # Complete styling with theme system
├── js/
│   ├── main.js         # Core application logic
│   ├── storage.js      # Data persistence utilities
│   ├── themes.js       # Theme management system
│   └── tutorial.js     # Interactive tutorial system
├── data/
│   ├── words.js        # Word database (286K words)
│   ├── prompts.js      # Prompt definitions with difficulties
│   └── sn.js           # Sub-8 prompt data (generated)
└── utility/
    └── generateSN.js   # SN data generation utility
```

### Key Algorithms

#### Prompt Selection
- **Weighted Random Selection**: Configurable probability distributions
- **Adaptive Difficulty**: Dynamic adjustment based on performance
- **Regen Optimization**: Letter-rarity based scoring system

#### Auto-solve Logic
- **Intelligent Prioritization**: Letter count and rarity weighting
- **Performance Optimization**: Efficient filtering and scoring
- **Context Awareness**: Mode-specific selection strategies

#### Scoring Systems
- **Struggle Scoring**: Performance-based difficulty adjustment
- **Regen Scoring**: Heart collection and letter management
- **SN Weighting**: Solution count-based prompt frequency

### Performance Optimizations

#### Efficient Data Structures
- **Set-based Lookups**: O(1) word existence checking
- **Pre-computed Weights**: Cached scoring values
- **Lazy Loading**: On-demand data initialization

#### UI Performance
- **Virtual Scrolling**: Efficient large list rendering
- **Debounced Updates**: Optimized input handling
- **Selective Rendering**: Minimal DOM manipulation

### Browser Compatibility
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **ES6+ Features**: Modules, arrow functions, template literals
- **CSS Variables**: Dynamic theming support
- **Local Storage**: Data persistence requirement

## User Interface

### Layout Components
- **Sidebar Navigation**: Mode selection and quick access
- **Main Game Area**: Prompt display and input interface
- **Configuration Panel**: Settings and customization options
- **Statistics Dashboard**: Performance metrics and progress

### Interactive Elements
- **Mode Cards**: Visual mode selection with descriptions
- **Input Controls**: Enhanced typing interface with visual feedback
- **Settings Controls**: Sliders, dropdowns, and toggle switches
- **Data Visualization**: Charts and progress indicators

### Accessibility Features
- **Keyboard Navigation**: Full keyboard accessibility
- **Visual Feedback**: Clear state indicators and transitions
- **Responsive Design**: Adaptable to different screen sizes
- **High Contrast Support**: Theme-based contrast optimization

## Development Tools

### Utility Scripts
- **generateSN.js**: Automated SN prompt generation from word database
- **Data Processing**: Efficient large dataset handling
- **Validation Tools**: Data integrity checking

### Build System
- **No Build Process**: Direct file serving for simplicity
- **Module System**: ES6 imports for code organization
- **Development Mode**: Hot reload through browser refresh

## Extensibility

### Adding New Modes
- **Mode Registration**: Simple mode card and logic addition
- **Configuration Integration**: Automatic settings panel inclusion
- **Scoring Integration**: Compatible with existing stat system

### Theme System
- **CSS Variables**: Easy color scheme customization
- **Dynamic Switching**: Runtime theme changes
- **Persistence**: Automatic theme preference saving

### Data Sources
- **Modular Data**: Easy word database replacement
- **Format Standardization**: Consistent data structure
- **Validation**: Built-in data integrity checking

## Security Considerations

### Data Privacy
- **Local Storage Only**: No external data transmission
- **Client-side Processing**: All computation performed locally
- **No Tracking**: User analytics not collected or transmitted

### Input Validation
- **Sanitization**: All user inputs properly sanitized
- **Type Checking**: Robust data type validation
- **Error Handling**: Graceful failure recovery

## Future Enhancements

### Planned Features
- **Multi-language Support**: International word databases
- **Cloud Sync**: Optional cloud-based progress synchronization
- **Advanced Analytics**: More detailed performance insights
- **Social Features**: Competitive leaderboards and sharing

### Technical Improvements
- **Service Worker**: Offline functionality
- **WebAssembly**: Performance-critical computations
- **Progressive Web App**: Enhanced mobile experience

---

## Getting Started

### Prerequisites
- Modern web browser with ES6+ support
- Local web server (optional, for development)

### Installation
1. Clone or download the project files
2. Serve the directory with a web server
3. Open `index.html` in a modern browser

### Usage
1. Select a game mode from the sidebar
2. Configure settings in the Configuration tab
3. Start typing words containing the displayed prompt
4. Track progress in the Statistics tab
5. Customize experience with themes and wordlists

## Contributing

### Code Style
- ES6+ JavaScript with module imports
- CSS3 with custom properties for theming
- Semantic HTML5 markup
- Consistent indentation and formatting

### Testing
- Manual testing across different browsers
- Performance testing with large datasets
- Accessibility validation
- User experience testing

---

*Last Updated: 2025*
