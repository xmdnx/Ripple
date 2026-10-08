import { useState, useRef, useEffect, useCallback } from "react";
import { TABS } from "../constants/tabs";

export function useTabNavigation({
  tabOrder,
  hiddenTabs,
  defaultTabId,
  isMusicActive,
  mode,
  isDragging,
}) {
  const visibleTabs = tabOrder.filter((id) => {
    if (!TABS.some((t) => t.id === id)) return false;
    if (hiddenTabs.includes(id)) return false;
    if (id === 3 && !isMusicActive) return false;
    return true;
  });

  const [[currentTabId, direction], setTabState] = useState(() => {
    const id = visibleTabs.includes(defaultTabId) ? defaultTabId : (visibleTabs[0] ?? 0);
    return [id, 0];
  });

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.includes(currentTabId)) {
      setTabState([visibleTabs[0], 0]);
    }
  }, [hiddenTabs, visibleTabs, currentTabId]);

  const switchTab = useCallback((step) => {
    if (visibleTabs.length <= 1) return;
    setTabState(([currentId]) => {
      const idx = visibleTabs.indexOf(currentId);
      let nextIdx = idx + step;
      if (nextIdx < 0) nextIdx = visibleTabs.length - 1;
      if (nextIdx >= visibleTabs.length) nextIdx = 0;
      return [visibleTabs[nextIdx], step];
    });
  }, [visibleTabs]);

  // Touchpad & Wheel gesture debouncing: strictly one tab change per physical swipe gesture
  const wheelLockout = useRef(false);
  const wheelAccumulator = useRef(0);
  const wheelResetTimeout = useRef(null);
  const wheelLockoutTimeout = useRef(null);
  const wheelThreshold = 35;

  const handleWheelSwipe = (e) => {
    if (mode !== "large" || isDragging) return;
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;

    e.preventDefault();

    // Reset accumulator once user lifts fingers and momentum ceases
    if (wheelResetTimeout.current) clearTimeout(wheelResetTimeout.current);
    wheelResetTimeout.current = setTimeout(() => {
      wheelAccumulator.current = 0;
      wheelLockout.current = false;
    }, 160);

    if (wheelLockout.current) return;

    wheelAccumulator.current += e.deltaX;

    if (Math.abs(wheelAccumulator.current) >= wheelThreshold) {
      const step = wheelAccumulator.current > 0 ? 1 : -1;
      wheelAccumulator.current = 0;
      wheelLockout.current = true;
      switchTab(step);

      if (wheelLockoutTimeout.current) clearTimeout(wheelLockoutTimeout.current);
      wheelLockoutTimeout.current = setTimeout(() => {
        wheelLockout.current = false;
      }, 320);
    }
  };

  const isInteractiveTarget = (target) => {
    return Boolean(
      target?.closest?.("button") ||
      target?.closest?.("input") ||
      target?.closest?.("select") ||
      target?.closest?.("textarea") ||
      target?.closest?.(".tab-order-item") ||
      target?.closest?.(".task-row") ||
      target?.closest?.(".clipboard-row")
    );
  };

  const swipeStartX = useRef(null);
  const swipeStartY = useRef(null);
  const swipeMoved = useRef(false);
  const suppressClick = useRef(false);
  const swipeThreshold = 40;

  const handlePointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const target = e.target;
    if (mode !== "large" || isDragging || isInteractiveTarget(target) || target?.closest("#userinput") || target?.id === "userinput") {
      swipeStartX.current = null;
      return;
    }
    swipeStartX.current = e.clientX;
    swipeStartY.current = e.clientY;
    swipeMoved.current = false;
  };

  const handlePointerMove = (e) => {
    if (swipeStartX.current === null || mode !== "large") return;
    const dx = Math.abs(e.clientX - swipeStartX.current);
    const dy = Math.abs(e.clientY - swipeStartY.current);
    if (dx > 8 || dy > 8) {
      swipeMoved.current = true;
      suppressClick.current = true;
    }
  };

  const handlePointerUp = (e) => {
    setTimeout(() => {
      suppressClick.current = false;
    }, 100);

    if (swipeStartX.current === null) return;
    const startX = swipeStartX.current;
    const startY = swipeStartY.current;
    swipeStartX.current = null;

    if (mode !== "large" || isDragging) return;
    if (!swipeMoved.current) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) < swipeThreshold || Math.abs(dx) <= Math.abs(dy)) return;

    switchTab(dx > 0 ? -1 : 1);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        switchTab(1);
      } else if (e.key === "ArrowLeft") {
        switchTab(-1);
      } else if (e.ctrlKey && e.key >= "1" && e.key <= "8") {
        const idx = parseInt(e.key) - 1;
        if (visibleTabs[idx] !== undefined) {
          const targetId = visibleTabs[idx];
          setTabState([targetId, targetId > currentTabId ? 1 : -1]);
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [visibleTabs, currentTabId, switchTab]);

  return {
    visibleTabs,
    currentTabId,
    direction,
    handleWheelSwipe,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    suppressClick,
    isInteractiveTarget,
  };
}
