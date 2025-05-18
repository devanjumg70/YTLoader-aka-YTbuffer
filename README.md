# YTLoader-aka-YTbuffer YouTube Complete Buffer Extension

A Chrome extension that forces complete video buffering on YouTube for uninterrupted playback.
This Chrome Extension makes YouTube videos load fully in advance, like how it used to work years ago. It helps you watch videos without annoying pauses or buffering, even if your internet is slow or unstable. Just install it, and enjoy smoother, uninterrupted playback automatically.

This is the original, fully functional, simple one -- just download it and enjoy, that's it!


I have made another one as well ⤵️

https://github.com/devanjumg70/YTbuffer-Youtube-Video-Preloader   this is the one I am working on now, yet to test for full functionality and issues

## Features

- Automatically detects YouTube video elements
- Forces complete preloading of videos
- Supports both DASH and progressive video formats
- Works silently in the background with no UI elements
- Preserves original playback position and state
- Optimized for performance and memory usage

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the extension directory
5. The extension will automatically start working when you visit YouTube

## How It Works

This extension uses several techniques to ensure YouTube videos are fully buffered:

1. **Video Detection**: MutationObserver is used to detect YouTube video elements as they appear in the DOM
2. **Buffer Monitoring**: Constantly checks the video buffer state to determine if more buffering is needed
3. **Seeking Strategy**: Uses strategic seeking to different parts of the video to force YouTube to buffer those segments
4. **Format Handling**: Automatically detects and handles both DASH streaming and progressive download formats

## Privacy

This extension:
- Does not collect any user data
- Does not modify video content
- Does not interfere with YouTube's functionality
- Runs completely locally on your machine

## License

MIT

Made with⚡by @anjumg70 @devanjumg70 for uninterrupted viewing experiences
