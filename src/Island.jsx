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
import { useShelf } from "./hooks/useShelf";
import { useTabNavigation } from "./hooks/useTabNavigation";
import { measureTextWidth } from "./utils/ui";
import { QuickView } from "./ui/QuickView";
import { FolderDown } from "lucide-react";

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
  const [mediaMaxIslandWidth] = useSetting("mediaMaxIslandWidth");
  const [mediaMarqueeEnabled] = useSetting("mediaMarqueeEnabled");
  const [mediaShowArtwork] = useSetting("mediaShowArtwork");
  const [mediaArtworkRadius] = useSetting("mediaArtworkRadius");

  const [displays, setDisplays] = useState([]);

  const { time } = useClock();
  const { weather } = useWeather();
  const shelf = useShelf();
  const [isDragOverIsland, setIsDragOverIsland] = useState(false);
  const dragCounter = useRef(0);
  const modeBeforeDragRef = useRef(null);
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
    setCurrentTabId,
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

  useEffect(() => {
    const handleGlobalDragStart = () => {
      isDraggingRef.current = true;
      setIsDragging(true);
    };

    const handleGlobalDragEnd = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      suppressClick.current = true;
      setTimeout(() => {
        suppressClick.current = false;
        const island = islandElementRef.current;
        if (island && !island.matches(":hover")) {
          setIsHovered(false);
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
      }, 150);
    };

    window.addEventListener("dragstart", handleGlobalDragStart, true);
    window.addEventListener("dragend", handleGlobalDragEnd, true);
    return () => {
      window.removeEventListener("dragstart", handleGlobalDragStart, true);
      window.removeEventListener("dragend", handleGlobalDragEnd, true);
    };
  }, [standbyBorderEnabled, largeStandbyEnabled]);

  const maxAllowedWidth = Number(mediaMaxIslandWidth) || 360;
  const nowPlayingText = spotifyTrack?.name ? `${spotifyTrack.name}${spotifyTrack.artist ? ` • ${spotifyTrack.artist}` : ""}` : "";
  const textWidth = measureTextWidth(nowPlayingText) || (nowPlayingText.length * 7);
  const hasArtwork = Boolean(mediaShowArtwork && spotifyTrack?.artwork_url);
  // Add padding: left padding (12) + optional artwork (26 + 8) + waveform (24) + gap (8) + right padding (12) + text buffer (10)
  const baseExtraSpace = (hasArtwork ? 34 : 0) + 64;
  const nowPlayingWidth = Math.min(maxAllowedWidth, Math.max(hasArtwork ? 170 : 140, Math.ceil(textWidth + baseExtraSpace)));

  const activeTabDef = getTabById(currentTab);
  const activeDimensions = typeof activeTabDef?.dimensions === "function"
    ? activeTabDef.dimensions({ positionMode })
    : (activeTabDef?.dimensions ?? { width: 380, height: 190 });

  const hasAlert = alert || chargingAlert || bluetoothAlert || cameraAlert || microphoneAlert;
  const isNowPlayingCompact = (isPlaying || showPausedQuickView) && !hasAlert;
  let width = mode === "large"
    ? activeDimensions.width
    : (mode === "quick" && isNowPlayingCompact)
      ? nowPlayingWidth
      : (mode === "quick" || hasAlert)
        ? 260
        : isNowPlayingCompact
          ? nowPlayingWidth
          : 170;

  let height = mode === "large" ? activeDimensions.height : 40;

  const tabVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : direction < 0 ? -300 : 0,
      opacity: direction === 0 ? 1 : 0,
      scale: direction === 0 ? 1 : 0.95,
      filter: direction === 0 ? "blur(0px)" : "blur(10px)",
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : direction > 0 ? -300 : 0,
      opacity: direction === 0 ? 1 : 0,
      scale: direction === 0 ? 1 : 0.95,
      filter: direction === 0 ? "blur(0px)" : "blur(10px)",
    }),
  };

  const handleIslandDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    if (dt?.types?.includes("ripple-tab-reorder") || dt?.types?.includes("ripple-shelf-drag")) {
      return;
    }

    dragCounter.current += 1;
    if (!isDragOverIsland) {
      setIsDragOverIsland(true);
      if (mode !== "large") {
        modeBeforeDragRef.current = mode;
        setMode("large");
      }
      setCurrentTabId(5, 0);
      if (window.electronAPI) {
        window.electronAPI.setIgnoreMouseEvents(false, false);
      }
    }
  };

  const handleIslandDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    if (dt?.types?.includes("ripple-tab-reorder") || dt?.types?.includes("ripple-shelf-drag")) {
      return;
    }
    try {
      e.dataTransfer.dropEffect = "copy";
    } catch (_) {}
  };

  const handleIslandDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    if (dt?.types?.includes("ripple-tab-reorder") || dt?.types?.includes("ripple-shelf-drag")) {
      return;
    }

    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragOverIsland(false);
      if (modeBeforeDragRef.current) {
        setMode(modeBeforeDragRef.current);
        modeBeforeDragRef.current = null;
      }
    }
  };

  const handleIslandDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    if (dt?.types?.includes("ripple-tab-reorder") || dt?.types?.includes("ripple-shelf-drag")) {
      return;
    }

    dragCounter.current = 0;
    setIsDragOverIsland(false);
    modeBeforeDragRef.current = null;

    if (!dt) return;

    const newEntries = [];

    // 1. Files
    if (dt.files && dt.files.length > 0) {
      for (let i = 0; i < dt.files.length; i++) {
        const file = dt.files[i];
        let filePath = "";
        try {
          if (window.electronAPI?.getPathForFile) {
            filePath = window.electronAPI.getPathForFile(file);
          } else if (file.path) {
            filePath = file.path;
          }
        } catch (_) {}

        const isImage = file.type?.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(file.name);
        let previewUrl = null;
        if (isImage) {
          try {
            previewUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(file);
            });
          } catch (_) {}
        }

        newEntries.push({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          type: isImage ? "image" : "file",
          name: file.name || (isImage ? "Image" : "File"),
          path: filePath,
          size: file.size || 0,
          preview: previewUrl,
          createdAt: Date.now(),
        });
      }
    } else {
      // 2. Browser image drag
      const html = dt.getData("text/html");
      let imgSrc = null;
      if (html) {
        const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (match && match[1]) {
          imgSrc = match[1];
        }
      }

      // 3. Plain text or URL
      const text = dt.getData("text/plain") || dt.getData("text/uri-list");
      if (imgSrc) {
        newEntries.push({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          type: "image",
          name: "Web Image",
          path: imgSrc,
          preview: imgSrc,
          createdAt: Date.now(),
        });
      } else if (text && text.trim()) {
        const trimmed = text.trim();
        const isUrl = /^https?:\/\//i.test(trimmed);
        newEntries.push({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          type: isUrl ? "url" : "text",
          content: trimmed,
          name: isUrl ? trimmed : undefined,
          createdAt: Date.now(),
        });
      }
    }

    if (newEntries.length > 0) {
      shelf.addItems(newEntries);
    }
  };

  const ActiveComponent = activeTabDef?.Component;

  return (
    <motion.div
      id="Island"
      ref={islandElementRef}
      onDragEnter={handleIslandDragEnter}
      onDragOver={handleIslandDragOver}
      onDragLeave={handleIslandDragLeave}
      onDrop={handleIslandDrop}
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

        // If clicking compact island:
        // - when music is active -> open Media tab (id: 3) without slide animation
        // - when showing clock/idle status -> open Overview tab (id: 2) without slide animation
        if (mode !== "large") {
          const hasAlert = alert || chargingAlert || bluetoothAlert || cameraAlert || microphoneAlert;
          if ((isPlaying || showPausedQuickView) && !hasAlert) {
            setCurrentTabId(3, 0);
          } else if (!hasAlert) {
            setCurrentTabId(2, 0);
          }
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
      {/* Quickview bar: always show content in compact mode (clock, media, or alerts) */}
      {mode !== "large" && (
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
          mediaMarqueeEnabled={mediaMarqueeEnabled}
          mediaShowArtwork={mediaShowArtwork}
          mediaArtworkRadius={mediaArtworkRadius}
          islandWidth={width}
        />
      )}

      {/* Large mode tab container */}
      <AnimatePresence custom={direction} mode="popLayout" initial={direction !== 0}>
        {mode === "large" && (
          <motion.div
            key={currentTabId}
            custom={direction}
            variants={tabVariants}
            initial={direction === 0 ? "center" : "enter"}
            animate="center"
            exit="exit"
            transition={{
              x: direction === 0 ? { duration: 0 } : { type: "spring", stiffness: 450, damping: 40, mass: 1 },
              opacity: { duration: direction === 0 ? 0 : 0.15 },
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
                shelf={shelf}
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

      {/* Drag & Drop to Shelf Overlay */}
      <AnimatePresence>
        {isDragOverIsland && (
          <motion.div
            key="shelf-drop-overlay"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              right: 8,
              bottom: 8,
              borderRadius: mode === "large" && theme === "win95" ? 0 : 20,
              border: `2px dashed ${textColor || "rgba(255, 255, 255, 0.7)"}`,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              zIndex: 1000,
              pointerEvents: "none",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FolderDown size={24} color={textColor || "#FFFFFF"} />
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: textColor || "#FFFFFF",
                letterSpacing: "0.2px",
              }}
            >
              Save to Shelf
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
