import { useState, useEffect, useRef } from "react";

export function useSystemMedia() {
  const [spotifyTrack, setSpotifyTrack] = useState(null);
  const [showPausedQuickView, setShowPausedQuickView] = useState(false);
  const pausedTimeout = useRef(null);

  useEffect(() => {
    const fetchMedia = async () => {
      if (window.electronAPI?.getSystemMedia) {
        try {
          const track = await window.electronAPI.getSystemMedia();
          setSpotifyTrack(track);
        } catch (e) {
          console.error(e);
        }
      }
    };

    fetchMedia();
    const interval = setInterval(fetchMedia, 2000);
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
