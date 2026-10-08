import { useState, useEffect, useRef } from "react";

export function useSystemMedia() {
  const [spotifyTrack, setSpotifyTrack] = useState(null);
  const [showPausedQuickView, setShowPausedQuickView] = useState(false);
  const pausedTimeout = useRef(null);

  useEffect(() => {
    // Immediate initial probe
    if (window.electronAPI?.getSystemMedia) {
      window.electronAPI.getSystemMedia().then((track) => {
        if (track !== undefined) setSpotifyTrack(track);
      }).catch(console.error);
    }

    // Reactive push listener from D-Bus / OS events
    if (window.electronAPI?.onSystemMediaUpdated) {
      const unsubscribe = window.electronAPI.onSystemMediaUpdated((track) => {
        setSpotifyTrack(track);
      });
      return () => unsubscribe();
    }

    // Fallback polling for platforms without push notifications
    const interval = setInterval(async () => {
      if (window.electronAPI?.getSystemMedia) {
        try {
          const track = await window.electronAPI.getSystemMedia();
          setSpotifyTrack(track);
        } catch (e) {
          console.error(e);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (spotifyTrack?.state === "paused") {
      setShowPausedQuickView(true);
      if (pausedTimeout.current) clearTimeout(pausedTimeout.current);
      pausedTimeout.current = setTimeout(() => {
        setShowPausedQuickView(false);
      }, 3000);
    } else {
      setShowPausedQuickView(false);
      if (pausedTimeout.current) clearTimeout(pausedTimeout.current);
    }
  }, [spotifyTrack?.state]);

  const isPlaying = spotifyTrack?.state === "playing";

  return {
    spotifyTrack,
    isPlaying,
    showPausedQuickView,
  };
}
