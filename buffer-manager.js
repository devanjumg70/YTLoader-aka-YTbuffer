class BufferManager {
  constructor(videoElement) {
    this.video = videoElement;
    this.originalPlaybackRate = 1;
    this.originalCurrentTime = 0;
    this.isBuffering = false;
    this.lastBufferedEnd = 0;
    this.requestId = null;
    this.isActive = false;
    this.isDASH = false;
    
    this.handleSeekDebounced = window.debounce(this._handleSeek.bind(this), 300);
    
    this._onPlayingBound = this._onPlaying.bind(this);
    this._onPauseBound = this._onPause.bind(this);
    this._onWaitingBound = this._onWaiting.bind(this);
    this._onSeekedBound = this._onSeeked.bind(this);
    this._onEndedBound = this._onEnded.bind(this);
  }
  
  start() {
    if (this.isActive) return;
    
    try {
      this.isActive = true;
      this._detectVideoFormat();
      this._addEventListeners();
      this._startMonitoringBuffer();
      
      window.logger.info('Buffer manager started - Will ensure complete video buffering');
    } catch (error) {
      window.logger.error('Error starting buffer manager:', error);
      this.stop();
    }
  }
  
  stop() {
    if (!this.isActive) return;
    
    try {
      this.isActive = false;
      this._removeEventListeners();
      this._stopMonitoringBuffer();
      
      window.logger.info('Buffer manager stopped');
    } catch (error) {
      window.logger.error('Error stopping buffer manager:', error);
    }
  }
  
  forceBufferEntireVideo() {
    if (!this.isActive || this.isBuffering) return;
    
    try {
      this.isBuffering = true;
      
      this.originalPlaybackRate = this.video.playbackRate;
      this.originalCurrentTime = this.video.currentTime;
      const wasPaused = this.video.paused;
      
      if (!wasPaused) {
        this.video.pause();
      }
      
      window.logger.info('Starting full video buffering...');
      
      if (this.isDASH) {
        this._handleDASHBuffering(wasPaused);
      } else {
        this._handleProgressiveBuffering(wasPaused);
      }
    } catch (error) {
      window.logger.error('Error during force buffering:', error);
      this._resetAfterBuffering(true);
    }
  }
  
  _handleDASHBuffering(wasPaused) {
    try {
      const duration = this.video.duration;
      const segmentSize = 30;
      let currentSegment = 0;
      
      const bufferNextSegment = () => {
        const segmentStart = currentSegment * segmentSize;
        
        if (segmentStart >= duration) {
          this._resetAfterBuffering(wasPaused);
          return;
        }
        
        const progress = Math.min(100, (segmentStart / duration) * 100).toFixed(1);
        window.logger.info(`Buffering DASH segment ${currentSegment + 1} (${progress}% complete)`);
        
        this.video.currentTime = segmentStart;
        
        const onSegmentBuffered = () => {
          this.video.removeEventListener('seeked', onSegmentBuffered);
          
          const checkSegmentBuffer = () => {
            const buffered = this._getBufferedTimeRanges();
            const segmentEnd = Math.min(segmentStart + segmentSize, duration);
            
            let isSegmentBuffered = false;
            for (let i = 0; i < buffered.length; i++) {
              if (buffered.start(i) <= segmentStart && buffered.end(i) >= segmentEnd) {
                isSegmentBuffered = true;
                break;
              }
            }
            
            if (isSegmentBuffered) {
              currentSegment++;
              setTimeout(bufferNextSegment, 100);
            } else {
              setTimeout(checkSegmentBuffer, 500);
            }
          };
          
          checkSegmentBuffer();
        };
        
        this.video.addEventListener('seeked', onSegmentBuffered);
      };
      
      bufferNextSegment();
    } catch (error) {
      window.logger.error('Error during DASH buffering:', error);
      this._resetAfterBuffering(wasPaused);
    }
  }
  
  _handleProgressiveBuffering(wasPaused) {
    try {
      const duration = this.video.duration;
      
      window.logger.info('Starting progressive video buffering...');
      this.video.currentTime = duration - 0.1;
      
      const onInitialSeek = () => {
        this.video.removeEventListener('seeked', onInitialSeek);
        
        const checkBufferProgress = () => {
          const buffered = this._getBufferedTimeRanges();
          
          let maxBuffered = 0;
          for (let i = 0; i < buffered.length; i++) {
            if (buffered.end(i) > maxBuffered) {
              maxBuffered = buffered.end(i);
            }
          }
          
          const progress = Math.min(100, (maxBuffered / duration) * 100).toFixed(1);
          window.logger.info(`Buffering progress: ${progress}%`);
          
          let isFullyBuffered = false;
          for (let i = 0; i < buffered.length; i++) {
            if (buffered.start(i) <= 0 && buffered.end(i) >= duration - 1) {
              isFullyBuffered = true;
              break;
            }
          }
          
          if (isFullyBuffered) {
            window.logger.info('Video fully buffered!');
            this._resetAfterBuffering(wasPaused);
          } else {
            setTimeout(checkBufferProgress, 1000);
          }
        };
        
        checkBufferProgress();
      };
      
      this.video.addEventListener('seeked', onInitialSeek);
    } catch (error) {
      window.logger.error('Error during progressive buffering:', error);
      this._resetAfterBuffering(wasPaused);
    }
  }
  
  _resetAfterBuffering(wasPaused) {
    try {
      this.video.currentTime = this.originalCurrentTime;
      this.video.playbackRate = this.originalPlaybackRate;
      
      if (!wasPaused) {
        this.video.play().catch(error => {
          window.logger.error('Error playing video after buffering:', error);
        });
      }
      
      this.isBuffering = false;
      window.logger.info('Buffering complete, reset to original state');
    } catch (error) {
      window.logger.error('Error resetting after buffering:', error);
      this.isBuffering = false;
    }
  }
  
  _detectVideoFormat() {
    try {
      if (this.video.src.startsWith('blob:')) {
        this.isDASH = true;
        window.logger.info('DASH video format detected');
        return;
      }
      
      setTimeout(() => {
        const buffered = this._getBufferedTimeRanges();
        if (buffered.length > 1) {
          this.isDASH = true;
          window.logger.info('DASH video format detected based on buffer behavior');
        } else {
          window.logger.info('Progressive video format detected');
        }
      }, 1000);
    } catch (error) {
      window.logger.error('Error detecting video format:', error);
      this.isDASH = true;
    }
  }
  
  _addEventListeners() {
    try {
      this.video.addEventListener('playing', this._onPlayingBound);
      this.video.addEventListener('pause', this._onPauseBound);
      this.video.addEventListener('waiting', this._onWaitingBound);
      this.video.addEventListener('seeked', this._onSeekedBound);
      this.video.addEventListener('ended', this._onEndedBound);
    } catch (error) {
      window.logger.error('Error adding event listeners:', error);
    }
  }
  
  _removeEventListeners() {
    try {
      this.video.removeEventListener('playing', this._onPlayingBound);
      this.video.removeEventListener('pause', this._onPauseBound);
      this.video.removeEventListener('waiting', this._onWaitingBound);
      this.video.removeEventListener('seeked', this._onSeekedBound);
      this.video.removeEventListener('ended', this._onEndedBound);
    } catch (error) {
      window.logger.error('Error removing event listeners:', error);
    }
  }
  
  _startMonitoringBuffer() {
    try {
      const checkBuffer = () => {
        if (!this.isActive) return;
        
        this._checkBufferStatus();
        this.requestId = requestAnimationFrame(checkBuffer);
      };
      
      this.requestId = requestAnimationFrame(checkBuffer);
    } catch (error) {
      window.logger.error('Error starting buffer monitoring:', error);
    }
  }
  
  _stopMonitoringBuffer() {
    try {
      if (this.requestId) {
        cancelAnimationFrame(this.requestId);
        this.requestId = null;
      }
    } catch (error) {
      window.logger.error('Error stopping buffer monitoring:', error);
    }
  }
  
  _checkBufferStatus() {
    try {
      if (this.isBuffering || !this.isActive) return;
      
      const buffered = this._getBufferedTimeRanges();
      const currentTime = this.video.currentTime;
      const duration = this.video.duration;
      
      if (currentTime >= duration - 1) return;
      
      let currentBufferEnd = 0;
      for (let i = 0; i < buffered.length; i++) {
        if (buffered.start(i) <= currentTime && buffered.end(i) > currentTime) {
          currentBufferEnd = buffered.end(i);
          break;
        }
      }
      
      if (currentBufferEnd > 0 && 
          this.lastBufferedEnd > 0 && 
          currentBufferEnd === this.lastBufferedEnd &&
          currentBufferEnd < duration - 1) {
        window.logger.info('Buffer stalled, forcing complete buffering...');
        this.forceBufferEntireVideo();
      }
      
      this.lastBufferedEnd = currentBufferEnd;
    } catch (error) {
      window.logger.error('Error checking buffer status:', error);
    }
  }
  
  _getBufferedTimeRanges() {
    try {
      return this.video.buffered || { length: 0, start: () => 0, end: () => 0 };
    } catch (error) {
      window.logger.error('Error getting buffered time ranges:', error);
      return { length: 0, start: () => 0, end: () => 0 };
    }
  }
  
  _handleSeek() {
    try {
      if (!this.isActive || this.isBuffering) return;
      
      const buffered = this._getBufferedTimeRanges();
      const currentTime = this.video.currentTime;
      let isInBufferedRange = false;
      
      for (let i = 0; i < buffered.length; i++) {
        if (buffered.start(i) <= currentTime && buffered.end(i) > currentTime) {
          isInBufferedRange = true;
          break;
        }
      }
      
      if (!isInBufferedRange) {
        window.logger.info('Seek to unbuffered region detected');
        setTimeout(() => {
          if (this.video.readyState < 3) {
            this.forceBufferEntireVideo();
          }
        }, 1000);
      }
    } catch (error) {
      window.logger.error('Error handling seek:', error);
    }
  }
  
  _onPlaying() {
    try {
      if (!this.isBuffering && this.isActive) {
        const buffered = this._getBufferedTimeRanges();
        const currentTime = this.video.currentTime;
        const duration = this.video.duration;
        
        let maxBufferedAhead = 0;
        for (let i = 0; i < buffered.length; i++) {
          if (buffered.start(i) <= currentTime && buffered.end(i) > currentTime) {
            maxBufferedAhead = buffered.end(i) - currentTime;
            break;
          }
        }
        
        const remainingDuration = duration - currentTime;
        if (maxBufferedAhead < remainingDuration * 0.25) {
          window.logger.info('Less than 25% buffered ahead, forcing complete buffering...');
          this.forceBufferEntireVideo();
        }
      }
    } catch (error) {
      window.logger.error('Error in playing handler:', error);
    }
  }
  
  _onPause() {
    try {
      if (!this.isBuffering && this.isActive) {
        const buffered = this._getBufferedTimeRanges();
        const duration = this.video.duration;
        
        let isFullyBuffered = false;
        for (let i = 0; i < buffered.length; i++) {
          if (buffered.start(i) <= 0 && buffered.end(i) >= duration - 1) {
            isFullyBuffered = true;
            break;
          }
        }
        
        if (!isFullyBuffered) {
          window.logger.info('Video paused, using opportunity to buffer completely...');
          this.forceBufferEntireVideo();
        }
      }
    } catch (error) {
      window.logger.error('Error in pause handler:', error);
    }
  }
  
  _onWaiting() {
    try {
      if (!this.isBuffering && this.isActive) {
        window.logger.info('Video waiting for buffer, forcing complete buffering...');
        this.forceBufferEntireVideo();
      }
    } catch (error) {
      window.logger.error('Error in waiting handler:', error);
    }
  }
  
  _onSeeked() {
    try {
      this.handleSeekDebounced();
    } catch (error) {
      window.logger.error('Error in seeked handler:', error);
    }
  }
  
  _onEnded() {
    try {
      if (this.isBuffering) {
        this._resetAfterBuffering(true);
      }
    } catch (error) {
      window.logger.error('Error in ended handler:', error);
    }
  }
}

// Make BufferManager available globally
window.BufferManager = BufferManager;