# RedditX

Power user suite of utilities for Reddit.

## Features

- **Automatic Removal**: Automatically removes promoted posts as they're detected
- **Seamless Experience**: No buttons to click - promoted content is removed instantly
- **Tracked Removals**: View all removed promoted posts in a popup interface
- **Real-time Monitoring**: Continuously monitors for new promoted content as you scroll
- **Works on Both Reddit Versions**: Compatible with both old and new Reddit interfaces

## Installation

### Step 1: Generate Icons

1. Open `icons/create_icons.html` in your browser
2. Click each download link to save the three icon files (icon16.png, icon48.png, icon128.png)
3. Save them in the `icons/` folder

### Step 2: Load Extension in Edge

1. Open Microsoft Edge
2. Navigate to `edge://extensions/`
3. Enable "Developer mode" in the bottom-left corner
4. Click "Load unpacked"
5. Select the `reddit-promoted-detector` folder
6. The extension is now installed

## Usage

1. Navigate to any Reddit page (reddit.com)
2. The extension will automatically remove promoted posts and replace them with placeholders showing "🎯 Promoted content removed"
3. Click the extension icon in the toolbar to view a list of all removed promoted posts
4. Click on any post in the list to navigate to it
5. Use the "Refresh" button to reload the current page

## How It Works

The extension uses multiple detection methods:

1. **Text Pattern Matching**: Searches for "Promoted" labels in post containers
2. **Data Attributes**: Checks for `data-promoted="true"` attributes
3. **DOM Structure**: Analyzes Reddit's post structure for promotional indicators
4. **Continuous Monitoring**: Uses MutationObserver to detect dynamically loaded content

## Files Structure

```
reddit-promoted-detector/
├── manifest.json         # Extension configuration
├── content.js           # Main detection and highlighting logic
├── popup.html           # Popup UI structure
├── popup.js            # Popup functionality
├── styles.css          # Highlighting styles
├── icons/              # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # This file
```

## Customization

### Change Highlight Color

Edit `styles.css` and modify the `border` and `background` properties in `.promoted-highlighted`:

```css
.promoted-highlighted {
  border: 3px solid #YOUR_COLOR !important;
  background: rgba(YOUR_RGB_VALUES, 0.1) !important;
}
```

### Adjust Detection Frequency

Edit `content.js` and change the interval in the `init()` method:

```javascript
setInterval(() => {
  const promoted = this.detectPromotedPosts();
  this.highlightPromotedPosts(promoted);
}, 2000); // Change 2000 to your desired milliseconds
```

## Browser Compatibility

- Microsoft Edge (Chromium-based)
- Google Chrome (should work with minimal modifications)
- Other Chromium-based browsers

## Privacy

This extension:
- Does not collect any personal data
- Does not send any information to external servers
- Only stores detected promoted posts locally in your browser
- Only runs on reddit.com domains

## License

Free to use and modify for personal purposes.
