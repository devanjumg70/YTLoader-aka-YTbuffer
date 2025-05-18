// Wait for the page to be ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('YouTube Complete Buffer extension initialized');
  
  // Create video detector instance
  const videoDetector = new VideoDetector();
  
  // Start detecting video elements
  videoDetector.startDetection((videoElement) => {
    console.log('YouTube video detected', videoElement);
    
    // Create and start buffer manager for the detected video
    const bufferManager = new BufferManager(videoElement);
    bufferManager.start();
  });
});