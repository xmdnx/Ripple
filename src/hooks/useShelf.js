import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "ripple_shelf_items";

export function useShelf() {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save shelf items:", e);
    }
  }, [items]);

  const addItems = useCallback((newEntries) => {
    if (!newEntries || newEntries.length === 0) return;
    setItems((prev) => [...newEntries, ...prev]);
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearShelf = useCallback(() => {
    setItems([]);
  }, []);

  return { items, addItems, removeItem, clearShelf };
}
