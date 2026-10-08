import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";
import { TABS, getTabById } from "./constants/tabs";
import { useWeather } from "./hooks/useWeather";
import { useSetting } from "./hooks/useSetting";
import { useBattery } from "./hooks/useBattery";
import { useDeviceAlerts } from "./hooks/useDeviceAlerts";
import { useSystemMedia } from "./hooks/useSystemMedia";
import { useClock } from "./hooks/useClock";
import { useClipboardHistory } from "./hooks/useClipboardHistory";
import { useTabNavigation } from "./hooks/useTabNavigation";
import { measureTextWidth } from "./utils/ui";
import { QuickView } from "./ui/QuickView";

export default function Island() {
  const islandElementRef = useRef(null);
  const lastWindowShapeRef = useRef(null);
  const isDraggingRef = useRef(false);

  const [mode, setMode] = useState("still");
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [tabOrder] = useSetting("tabOrder");
  const [hiddenTabs] = useSetting("hiddenTabs");
  const [defaultTabId] = useSetting("defaultTab");
  const [islandBorderEnabled] = useSetting("islandBorder");
  const [standbyBorderEnabled] = useSetting("standbyMode");
  const [largeStandbyEnabled] = useSetting("largeStandbyMode");
  const [hideNotActiveIslandEnabled] = useSetting("hideNotActiveIsland");
  const [showInfoWhenIdleEnabled] = useSetting("showInfoWhenIdle");
  const [theme, setTheme] = useState("default");
  const [bgColor, setBgColor] = useSetting("bgColor");
  const [textColor, setTextColor] = useSetting("textColor");
  const [bgImage, setBgImage] = useSetting("bgImage");
  const [positionMode] = useSetting("positionMode");
  const [islandX] = useSetting("islandX");
  const [islandY] = useSetting("islandY");
  const [currentDisplayId, setCurrentDisplayId] = useSetting("targetDisplay");
  const [autoLaunchEnabled] = useSetting("autoLaunch");
  const [newUser, setNewUser] = useSetting("newUser");

  const [displays, setDisplays] = useState([]);

  const { time } = useClock();
  const { weather } = useWeather();
  const clipboard = useClipboardHistory();
  const { percent, charging, alert, chargingAlert } = useBattery();
  const {
    bluetooth,
    bluetoothAlert,
    cameraInUse,
    cameraAlert,
    microphoneInUse,
    microphoneAlert,
  } = useDeviceAlerts();
  const { spotifyTrack, isPlaying, showPausedQuickView } = useSystemMedia();

  const isMusicActive = Boolean(spotifyTrack);

  const {
    visibleTabs,
    currentTabId,
    direction,
    handleWheelSwipe,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    suppressClick,
    isInteractiveTarget,
  } = useTabNavigation({
    tabOrder,
    hiddenTabs,
    defaultTabId,
    isMusicActive,
    mode,
    isDragging,
  });

  const currentTab = currentTabId;

  // Standby & alert mode transitions
  useEffect(() => {
    if (alert || chargingAlert || bluetoothAlert || cameraAlert || microphoneAlert) {
      setMode("quick");
    }
  }, [alert, chargingAlert, bluetoothAlert, cameraAlert, microphoneAlert]);

  useEffect(() => {
    if (standbyBorderEnabled && mode === "still") {
      setMode("quick");
    } else if (largeStandbyEnabled && mode === "still") {
      setMode("large");
    }
  }, [mode, standbyBorderEnabled, largeStandbyEnabled]);

  useEffect(() => {
    if (!isDragging && !isHovered) {
      const activeTag = document.activeElement?.tagName;
      if (activeTag !== "INPUT" && activeTag !== "TEXTAREA") {
        if (standbyBorderEnabled) {
          setMode("quick");
        } else if (largeStandbyEnabled) {
          setMode("large");
        } else {
          setMode("still");
        }
      }
    }
  }, [isDragging, isHovered, standbyBorderEnabled, largeStandbyEnabled]);

  useEffect(() => {
    const handleFocusOut = () => {
      setTimeout(() => {
        if (!isHovered) {
          const activeTag = document.activeElement?.tagName;
          if (activeTag !== "INPUT" && activeTag !== "TEXTAREA" && activeTag !== "SELECT") {
            if (standbyBorderEnabled) {
              setMode("quick");
            } else if (largeStandbyEnabled) {
              setMode("large");
            } else {
              setMode("still");
            }
          }
        }
      }, 100);
    };

    window.addEventListener("focusout", handleFocusOut);
    return () => window.removeEventListener("focusout", handleFocusOut);
  }, [isHovered, standbyBorderEnabled, largeStandbyEnabled]);

  // Themes
  useEffect(() => {
    if (theme === "sleek-black") {
      setBgColor("rgba(0, 0, 0, 0.64)");
      setTextColor("rgba(255, 255, 255)");
    } else if (theme === "win95") {
      setBgColor("rgba(195, 195, 195)");
      setTextColor("rgba(0, 0, 0)");
    } else if (theme === "invisible") {
      setBgImage("none");
      setBgColor("rgba(255, 255, 255, 0)");
      setTextColor("rgba(0, 0, 0, 0)");
    } else if (theme === "none") {
      setBgColor("#000000");
      setTextColor("#FFFFFF");
    }
  }, [theme]);

  // Window initialization and display settings
  useEffect(() => {
    if (window.electronAPI?.platform === "win32") {
      window.electronAPI?.buildAppCache?.();
    }

    if (currentDisplayId && window.electronAPI?.setDisplay) {
      window.electronAPI.setDisplay(currentDisplayId);
    }

    if (window.electronAPI?.updateWindowPosition) {
      window.electronAPI.updateWindowPosition(islandX, islandY);
    }

    if (window.electronAPI?.setAutoLaunch) {
      window.electronAPI.setAutoLaunch(autoLaunchEnabled);
    }

    if (newUser) {
      const timer = setTimeout(() => {
        window.electronAPI?.openExternal
          ? window.electronAPI.openExternal("https://github.com/TopMyster/Ripple/blob/main/instructions.md")
          : window.open("https://github.com/TopMyster/Ripple/blob/main/instructions.md", "_blank");
        setNewUser(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (currentTab === 7 && window.electronAPI?.getDisplays) {
      window.electronAPI.getDisplays().then(setDisplays);
    }
  }, [currentTab]);

  const handleDisplayChange = (e) => {
    const displayId = e.target.value;
    setCurrentDisplayId(displayId);
    if (window.electronAPI?.setDisplay) {
      window.electronAPI.setDisplay(displayId);
    }
  };

  const getSideStyles = () => {
    switch (positionMode) {
      case "top-left": return { left: "15px", top: "15px", x: "0%" };
      case "top-right": return { left: "calc(100% - 15px)", top: "15px", x: "-100%" };
      case "bottom-left": return { left: "15px", top: "auto", bottom: "45px", x: "0%" };
      case "bottom-right": return { left: "calc(100% - 15px)", top: "auto", bottom: "45px", x: "-100%" };
      case "top-center": return { left: "49.8%", top: "20px", x: "-50%" };
      case "bottom-center": return { left: "49.8%", top: "auto", bottom: "45px", x: "-50%" };
      default: return { left: `${islandX}%`, top: `${islandY}px`, x: "-50%" };
    }
  };
  const sideStyles = getSideStyles();

  const syncLinuxWindowShape = () => {
    if (window.electronAPI?.platform !== "linux") return;

    const element = islandElementRef.current;
    if (!element) return;

    const bounds = element.getBoundingClientRect();
    const padding = 28;
    const x = Math.max(0, Math.floor(bounds.left - padding));
    const y = Math.max(0, Math.floor(bounds.top - padding));
    const right = Math.min(window.innerWidth, Math.ceil(bounds.right + padding));
    const bottom = Math.min(window.innerHeight, Math.ceil(bounds.bottom + padding));
    const rect = {
      x,
      y,
      width: right - x,
      height: bottom - y,
      scaleFactor: window.devicePixelRatio || 1,
    };

    if (rect.width <= 0 || rect.height <= 0) return;
    const previous = lastWindowShapeRef.current;
    if (previous && previous.x === rect.x && previous.y === rect.y &&
        previous.width === rect.width && previous.height === rect.height) return;

    lastWindowShapeRef.current = rect;
    window.electronAPI.setWindowInputShape(rect);
  };

  useEffect(() => {
    syncLinuxWindowShape();
    window.addEventListener("resize", syncLinuxWindowShape);
    return () => window.removeEventListener("resize", syncLinuxWindowShape);
  }, []);

  const nowPlayingText = spotifyTrack?.name ? `${spotifyTrack.name}${spotifyTrack.artist ? ` • ${spotifyTrack.artist}` : ""}` : "";
  const textWidth = measureTextWidth(nowPlayingText) || (nowPlayingText.length * 7);
  const nowPlayingWidth = Math.min(300, Math.max(122, Math.ceil(textWidth + 24 + 6 + 20)));

  const activeTabDef = getTabById(currentTab);
  const activeDimensions = typeof activeTabDef?.dimensions === "function"
    ? activeTabDef.dimensions({ positionMode })
    : (activeTabDef?.dimensions ?? { width: 380, height: 190 });

  const hasAlert = alert || chargingAlert || bluetoothAlert || cameraAlert || microphoneAlert;
  let width = mode === "large"
    ? activeDimensions.width
    : (mode === "quick" && isPlaying && !hasAlert)
      ? nowPlayingWidth
      : (mode === "quick" || hasAlert)
        ? 260
        : isPlaying
          ? nowPlayingWidth
          : 170;

  let height = mode === "large" ? activeDimensions.height : 40;

  const tabVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : direction < 0 ? -300 : 0,
      opacity: 0,
      scale: 0.95,
      filter: "blur(10px)",
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : direction > 0 ? -300 : 0,
      opacity: 0,
      scale: 0.95,
      filter: "blur(10px)",
    }),
  };

  const ActiveComponent = activeTabDef?.Component;

  return (
    <motion.div
      id="Island"
      ref={islandElementRef}
      onMouseEnter={() => {
        setIsHovered(true);
        if (mode === "still" && showInfoWhenIdleEnabled && !isPlaying) {
          setMode("large");
        } else if (mode !== "large") {
          setMode("quick");
        }
        if (window.electronAPI) {
          window.electronAPI.setIgnoreMouseEvents(false, false);
        }
      }}
      onMouseLeave={() => {
        suppressClick.current = false;
        if (isDraggingRef.current) return;
        setIsHovered(false);
        if (window.electronAPI) {
          window.electronAPI.setIgnoreMouseEvents(true, true);
        }

        const activeTag = document.activeElement?.tagName;
        if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;

        if (standbyBorderEnabled) {
          setMode("quick");
        } else if (largeStandbyEnabled) {
          setMode("large");
        } else {
          setMode("still");
        }
      }}
      onClick={(e) => {
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        if (isInteractiveTarget(e.target)) return;

        const activeTag = document.activeElement?.tagName;
        if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") {
          document.activeElement.blur();
        }

        setMode((prev) => (prev === "large" ? "quick" : "large"));
        if (window.electronAPI) {
          window.electronAPI.setIgnoreMouseEvents(false, false);
        }
      }}
      onWheel={handleWheelSwipe}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      initial={{
        x: sideStyles.x,
        left: sideStyles.left,
        top: sideStyles.top || "auto",
        bottom: sideStyles.bottom || "auto",
      }}
      animate={{
        width: `${width}px`,
        height: `${height}px`,
        left: sideStyles.left,
        top: sideStyles.top || "auto",
        bottom: sideStyles.bottom || "auto",
        backgroundColor: hideNotActiveIslandEnabled && mode === "still" ? "rgba(0,0,0,0)" : bgColor,
        color: hideNotActiveIslandEnabled && mode === "still" ? "rgba(0,0,0,0)" : textColor,
        scale: isHovered ? 1.05 : 1,
        x: sideStyles.x,
        borderRadius:
          mode === "large" && theme === "win95"
            ? 0
            : mode === "large"
              ? (currentTab === 0 ? 28 : 30)
              : theme === "win95"
                ? 0
                : 14,
      }}
      onUpdate={syncLinuxWindowShape}
      onAnimationComplete={syncLinuxWindowShape}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 40,
        mass: 2.5,
        x: { duration: 0.15 },
      }}
      style={{
        display: "flex",
        alignItems: "center",
        backgroundImage: `url('${bgImage}')`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
        justifyContent: mode === "large" && currentTab === 3 ? "flex-start" : "center",
        overflow: "hidden",
        fontFamily: theme === "win95" ? "w95" : "OpenRunde",
        border:
          theme === "win95"
            ? "2px solid rgb(254, 254, 254)"
            : islandBorderEnabled
              ? cameraInUse
                ? "1px solid rgba(255, 215, 0, 0.8)"
                : microphoneInUse
                  ? "1px solid rgba(255, 154, 0, 0.8)"
                  : charging || chargingAlert
                    ? "1px solid rgba(111, 255, 123, 0.5)"
                    : percent <= 20 || alert
                      ? "1px solid rgba(255, 63, 63, 0.5)"
                      : bluetoothAlert
                        ? "1px solid rgba(0, 150, 255, 0.34)"
                        : hideNotActiveIslandEnabled
                          ? "none"
                          : `1px solid color-mix(in srgb, ${textColor}, transparent 70%)`
              : "none",
        borderColor:
          theme === "win95"
            ? "#FFFFFF #808080 #808080 #FFFFFF"
            : "none",
        boxShadow: hideNotActiveIslandEnabled && mode === "still" ? "none" : isHovered ? "0 0 32px rgba(0, 0, 0, 0.25)" : "0 0 24px rgba(0, 0, 0, 0.12)",
        "--island-text-color": textColor,
        "--island-bg-color": bgColor,
        position: "fixed",
        margin: 0,
        transition: "box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: "auto",
      }}
    >
      {/* Quickview bar */}
      {mode !== "large" && (mode === "quick" || (mode === "still" && showInfoWhenIdleEnabled) || (mode === "still" && (isPlaying || showPausedQuickView)) || hasAlert) && (
        <QuickView
          spotifyTrack={spotifyTrack}
          isPlaying={isPlaying}
          showPausedQuickView={showPausedQuickView}
          alert={alert}
          chargingAlert={chargingAlert}
          bluetoothAlert={bluetoothAlert}
          cameraAlert={cameraAlert}
          microphoneAlert={microphoneAlert}
          standbyBorderEnabled={standbyBorderEnabled}
          percent={percent}
          time={time}
          weather={weather}
          textColor={textColor}
          theme={theme}
        />
      )}

      {/* Large mode tab container */}
      <AnimatePresence custom={direction} mode="popLayout">
        {mode === "large" && (
          <motion.div
            key={currentTabId}
            custom={direction}
            variants={tabVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 450, damping: 40, mass: 1 },
              opacity: { duration: 0.15 },
            }}
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "absolute",
            }}
          >
            {ActiveComponent && (
              <ActiveComponent
                time={time}
                percent={percent}
                charging={charging}
                weather={weather}
                spotifyTrack={spotifyTrack}
                clipboard={clipboard}
                displays={displays}
                currentDisplayId={currentDisplayId}
                onDisplayChange={handleDisplayChange}
                theme={theme}
                setTheme={setTheme}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
