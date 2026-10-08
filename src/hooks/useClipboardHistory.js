import { useState, useEffect } from "react";

export function useClipboardHistory() {
  const [clipboard, setClipboard] = useState([]);

  useEffect(() => {
    let active = true;

    async function checkClipboard() {
      try {
        if (!navigator.clipboard?.readText) return;
        const text = await navigator.clipboard.readText();
        if (!active || !text) return;
        setClipboard((prev) => (prev[0] === text ? prev : [text, ...prev]));
      } catch {
        // Ignored when window is unfocused or clipboard permission is denied
      }
    }

    checkClipboard();
    const interval = setInterval(checkClipboard, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return clipboard;
}
