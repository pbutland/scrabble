# Scrabble Tile Visualizer

A web application that visualizes words using Scrabble letter tiles.

## Overview

The Scrabble Tile Visualizer displays words and phrases using Scrabble-style letter tiles. It accepts any combination of letters (A-Z) and spaces. For example:
- "scrabble" → S + C + R + A + B + B + L + E
- "tiles" → T + I + L + E + S
- "hello world" → H + E + L + L + O [space] W + O + R + L + D

This application visualizes words and phrases using Scrabble-style letter tiles.

## Features

- **Real-time visualization**: As you type, the application automatically visualizes the text
- **Input validation**: Only allows A-Z letters and spaces
- **Multi-word support**: Works with phrases and sentences, not just single words
- **Dark/light mode**: Switch between themes for comfortable viewing
- **Responsive design**: Works on desktop and mobile devices
- **SVG letter tiles**: High-quality visual representation of Scrabble tiles

## Usage

1. Open the application in your web browser
2. Enter a word or phrase in the input field (only A-Z letters and spaces are allowed)
3. The application will instantly visualize your text with Scrabble tiles
4. Toggle between light and dark mode using the radio buttons

## Technical Details

The application uses:

- **TypeScript** for type-safe JavaScript development
- **ES Modules** for modern JavaScript structuring
- **SVG** for high-quality tile visualizations
- **Simple text parsing** for handling input validation
- **Responsive CSS** with custom theming
- **Fetch API** for loading tile SVG files asynchronously

## Development

### Prerequisites

- Node.js (v18 or later)
- Yarn (v4.6.0 or later)

### Setup

```bash
# Clone the repository
git clone https://github.com/username/scrabble-tiles.git
cd scrabble-tiles

# Install dependencies
yarn install
```

### Development Commands

```bash
# Start development server
yarn start

# Build for production
yarn build
```

### Project Structure

```
/
├── tiles/             # SVG files for each letter tile (A-Z)
├── words/             # Example word visualizations
├── src/
│   ├── app.ts         # Main application code
│   └── tile-utils.ts  # Letter tile utilities
├── dist/              # Compiled output (generated)
├── index.html         # Main HTML file
├── alphabet.html      # Display of all available letter tiles
└── package.json       # Project configuration
```

## Credits

- SVG Scrabble tiles designed for this project
- Inspired by the classic Scrabble board game