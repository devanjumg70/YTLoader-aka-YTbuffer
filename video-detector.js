class VideoDetector {
  constructor() {
    this.observer = null;
    this.processedVideos = new WeakSet();
    this.callbackFn = null;
  }

  startDetection(callback) {
    this.callbackFn = callback;
    
    // Check if there are already video elements on the page
    this._checkExistingVideos();
    
    // Set up mutation observer to detect new video elements
    this._setupMutationObserver();
    
    // Listen for YouTube SPA navigation events
    this._setupNavigationListener();
  }
  
  stopDetection() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
  
  _checkExistingVideos() {
    try {
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach(video => this._processVideoElement(video));
    } catch (error) {
      window.logger.error('Error checking existing videos:', error);
    }
  }
  
  _setupMutationObserver() {
    try {
      this.observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.tagName === 'VIDEO') {
                this._processVideoElement(node);
              }
              
              const videos = node.querySelectorAll('video');
              videos.forEach(video => this._processVideoElement(video));
            }
          });
        });
      });
      
      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      window.logger.info('Video detection started - Monitoring for YouTube videos and Shorts');
    } catch (error) {
      window.logger.error('Error setting up mutation observer:', error);
    }
  }
  
  _setupNavigationListener() {
    try {
      // Listen for both regular navigation and Shorts navigation
      const navigationEvents = ['yt-navigate-finish', 'yt-page-data-updated'];
      
      navigationEvents.forEach(event => {
        window.addEventListener(event, () => {
          window.logger.info('YouTube navigation detected - Checking for new videos');
          setTimeout(() => this._checkExistingVideos(), 1000);
        });
      });
    } catch (error) {
      window.logger.error('Error setting up navigation listener:', error);
    }
  }
  
  _processVideoElement(videoElement) {
    try {
      if (this.processedVideos.has(videoElement)) {
        return;
      }
      
      const isYouTubeVideo = this._isYouTubeVideoPlayer(videoElement);
      
      if (isYouTubeVideo) {
        const isShort = this._isYouTubeShort();
        window.logger.info(`Detected ${isShort ? 'YouTube Short' : 'YouTube video'}`);
        
        this.processedVideos.add(videoElement);
        
        if (this.callbackFn) {
          this.callbackFn(videoElement);
        }
      }
    } catch (error) {
      window.logger.error('Error processing video element:', error);
    }
  }
  
  _isYouTubeVideoPlayer(videoElement) {
    try {
      let parentElement = videoElement.parentElement;
      let depth = 0;
      const maxDepth = 5;
      
      while (parentElement && depth < maxDepth) {
        const classList = parentElement.classList;
        
        if (classList && (
          classList.contains('html5-video-player') ||
          classList.contains('video-stream') ||
          classList.contains('ytp-player-content') ||
          classList.contains('shorts-player') // Added Shorts player detection
        )) {
          return true;
        }
        
        parentElement = parentElement.parentElement;
        depth++;
      }
      
      if (videoElement.src && videoElement.src.includes('youtube.com')) {
        return true;
      }
      
      return (
        typeof videoElement.getVideoData === 'function' ||
        typeof videoElement.getDuration === 'function'
      );
    } catch (error) {
      window.logger.error('Error checking if video is a YouTube player:', error);
      return false;
    }
  }
  
  _isYouTubeShort() {
    return window.location.pathname.includes('/shorts/');
  }
}

// Make VideoDetector available globally
window.VideoDetector = VideoDetector;