# My Chrome Extension

This is a simple Chrome extension that demonstrates the use of background scripts, content scripts, and popups.

## Project Structure

```
my-chrome-extension
├── src
│   ├── background.js       # Background script for handling events and managing the extension's lifecycle
│   ├── content.js          # Content script for interacting with web pages
│   └── popup
│       ├── popup.html      # HTML structure for the popup
│       └── popup.js        # JavaScript for handling user interactions in the popup
├── manifest.json           # Configuration file for the Chrome extension
└── README.md               # Documentation for the project
```

## Installation

1. Clone the repository or download the source code.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click on "Load unpacked" and select the `my-chrome-extension` directory.

## Usage

- Click on the extension icon in the Chrome toolbar to open the popup.
- The content script will automatically run on specified web pages, allowing interaction with the DOM.

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes. 

## License

This project is licensed under the MIT License.