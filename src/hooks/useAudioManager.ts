import { useState, useRef, useCallback, useEffect } from 'react';

export const useAudioManager = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  const initializeAudio = useCallback(() => {
    if (audioRef.current) return;

    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = volume;
    
    // Set up event listeners
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    audio.addEventListener('play', () => {
      setIsPlaying(true);
    });

    audio.addEventListener('pause', () => {
      setIsPlaying(false);
    });

    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
    });

    audioRef.current = audio;
  }, [volume]);

  // Toggle play/pause
  const togglePlay = useCallback(async () => {
    if (!audioRef.current) {
      initializeAudio();
      return;
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Audio play/pause error:', error);
    }
  }, [isPlaying, initializeAudio]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;

    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  // Handle volume change
  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!audioRef.current) return;

    setVolume(newVolume);
    if (!isMuted) {
      audioRef.current.volume = newVolume;
    }
  }, [isMuted]);

  // Handle seek
  const handleSeek = useCallback((newTime: number) => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  // Format time
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Load audio source
  const loadAudio = useCallback((src: string) => {
    if (!audioRef.current) {
      initializeAudio();
    }

    if (audioRef.current) {
      audioRef.current.src = src;
      audioRef.current.load();
    }
  }, [initializeAudio]);

  // Stop audio
  const stopAudio = useCallback(() => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlay,
    toggleMute,
    handleVolumeChange,
    handleSeek,
    formatTime,
    loadAudio,
    stopAudio,
    initializeAudio
  };
};