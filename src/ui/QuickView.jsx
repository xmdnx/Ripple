import { motion, AnimatePresence } from "framer-motion";
import { Camera, Mic, Headphones, Zap } from "lucide-react";
import { WeatherIcon } from "./icons";
import { measureTextWidth } from "../utils/ui";

export function QuickView({
  spotifyTrack,
  isPlaying,
  showPausedQuickView,
  alert,
  chargingAlert,
  bluetoothAlert,
  cameraAlert,
  microphoneAlert,
  standbyBorderEnabled,
  percent,
  time,
  weather,
  textColor,
  theme,
  mediaMarqueeEnabled = true,
  mediaShowArtwork = true,
  mediaArtworkRadius = 6,
  islandWidth = 170,
}) {
  const hasActiveAlert = alert || chargingAlert || bluetoothAlert || cameraAlert || microphoneAlert;
  const isNowPlaying = (isPlaying || showPausedQuickView) && !hasActiveAlert;

  const trackTitle = spotifyTrack?.name || "Music";
  const trackArtist = spotifyTrack?.artist || "";
  const fullTrackLabel = trackArtist ? `${trackTitle} • ${trackArtist}` : trackTitle;
  const hasArtwork = Boolean(mediaShowArtwork && spotifyTrack?.artwork_url);

  // Available text space = islandWidth - padding (28) - optional artwork (26 + 8) - waveform (24) - gap (10)
  const availableTextSpace = Math.max(40, islandWidth - 62 - (hasArtwork ? 34 : 0));
  const measuredWidth = measureTextWidth(trackTitle, "600 14px OpenRunde, Arial, sans-serif") +
    (trackArtist ? measureTextWidth(` • ${trackArtist}`, "400 12px OpenRunde, Arial, sans-serif") : 0);
  const isTextOverflowing = measuredWidth > availableTextSpace;
  const shouldMarquee = mediaMarqueeEnabled && isTextOverflowing;

  const borderRadiusVal = Number(mediaArtworkRadius) >= 13 ? "50%" : `${mediaArtworkRadius ?? 6}px`;

  return (
    <AnimatePresence mode="wait">
      {isNowPlaying ? (
        <motion.div
          key={spotifyTrack?.name ? `playing-${spotifyTrack.name}-${spotifyTrack.artist}` : "playing"}
          initial={{ opacity: 0, filter: "blur(4px)", scale: 0.98 }}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          exit={{ opacity: 0, filter: "blur(4px)", scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1], filter: { duration: 0.05 } }}
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 14px",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {hasArtwork && (
            <motion.img
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              src={spotifyTrack.artwork_url}
              alt="Artwork"
              style={{
                width: 26,
                height: 26,
                borderRadius: borderRadiusVal,
                objectFit: "cover",
                marginRight: 8,
                flexShrink: 0,
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.25)",
              }}
            />
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              overflow: "hidden",
              minWidth: 0,
              flex: 1,
              maskImage: shouldMarquee
                ? "linear-gradient(to right, transparent, black 10px, black calc(100% - 10px), transparent)"
                : "none",
              WebkitMaskImage: shouldMarquee
                ? "linear-gradient(to right, transparent, black 10px, black calc(100% - 10px), transparent)"
                : "none",
            }}
          >
            {shouldMarquee ? (
              <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{
                  repeat: Infinity,
                  ease: "linear",
                  duration: Math.max(8, fullTrackLabel.length * 0.35),
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  willChange: "transform",
                }}
              >
                <div style={{ display: "inline-flex", alignItems: "center", paddingRight: 24 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: textColor,
                      fontFamily: theme === "win95" ? "w95" : "OpenRunde",
                    }}
                  >
                    {trackTitle}
                  </span>
                  {trackArtist && (
                    <span
                      style={{
                        fontSize: 12,
                        opacity: 0.7,
                        marginLeft: 6,
                        color: textColor,
                        fontFamily: theme === "win95" ? "w95" : "OpenRunde",
                      }}
                    >
                      • {trackArtist}
                    </span>
                  )}
                </div>

                <div style={{ display: "inline-flex", alignItems: "center", paddingRight: 24 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: textColor,
                      fontFamily: theme === "win95" ? "w95" : "OpenRunde",
                    }}
                  >
                    {trackTitle}
                  </span>
                  {trackArtist && (
                    <span
                      style={{
                        fontSize: 12,
                        opacity: 0.7,
                        marginLeft: 6,
                        color: textColor,
                        fontFamily: theme === "win95" ? "w95" : "OpenRunde",
                      }}
                    >
                      • {trackArtist}
                    </span>
                  )}
                </div>
              </motion.div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    color: textColor,
                    fontFamily: theme === "win95" ? "w95" : "OpenRunde",
                  }}
                >
                  {trackTitle}
                </span>
                {trackArtist && (
                  <span
                    style={{
                      fontSize: 12,
                      opacity: 0.7,
                      marginLeft: 6,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      color: textColor,
                      fontFamily: theme === "win95" ? "w95" : "OpenRunde",
                    }}
                  >
                    • {trackArtist}
                  </span>
                )}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0, marginLeft: 8 }}>
            <span style={{ width: 3, height: 12, backgroundColor: textColor, borderRadius: 1.5, animation: isPlaying ? "soundWave 1.2s ease-in-out infinite alternate" : "none" }}></span>
            <span style={{ width: 3, height: 18, backgroundColor: textColor, borderRadius: 1.5, animation: isPlaying ? "soundWave 0.8s ease-in-out infinite alternate" : "none" }}></span>
            <span style={{ width: 3, height: 8, backgroundColor: textColor, borderRadius: 1.5, animation: isPlaying ? "soundWave 1.5s ease-in-out infinite alternate" : "none" }}></span>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="status"
          initial={{ opacity: 0, filter: "blur(4px)", scale: 0.98 }}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          exit={{ opacity: 0, filter: "blur(4px)", scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1], filter: { duration: 0.05 } }}
          style={{ width: "100%", height: "100%", position: "relative" }}
        >
          <h1
            className="text"
            style={{
              position: "absolute",
              top: "50%",
              left: "15px",
              transform: "translateY(-50%)",
              fontSize: 16,
              fontWeight: 600,
              margin: 0,
              color: chargingAlert
                ? "#6fff7bff"
                : alert
                  ? "#ff3f3fff"
                  : cameraAlert
                    ? "#ffff00ff"
                    : microphoneAlert
                      ? "#ff9a00ff"
                      : textColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              lineHeight: 1,
            }}
          >
            {chargingAlert ? (
              <Zap size={20} color="#6fff7b" />
            ) : alert ? (
              <Zap size={20} color="#ff3f3f" />
            ) : cameraAlert ? (
              <Camera size={20} color="#ffff00" />
            ) : microphoneAlert ? (
              <Mic size={20} color="#ff9a00" />
            ) : bluetoothAlert ? (
              <Headphones size={20} />
            ) : (
              time
            )}
          </h1>
          <h1
            className="text"
            style={{
              position: "absolute",
              top: "50%",
              right: "15px",
              transform: "translateY(-50%)",
              fontSize: 16,
              fontWeight: 600,
              margin: 0,
              color: chargingAlert
                ? "#6fff7bff"
                : alert
                  ? "#ff3f3fff"
                  : cameraAlert
                    ? "#ffff00ff"
                    : microphoneAlert
                      ? "#ff9a00ff"
                      : `${textColor}`,
              display: "flex",
              alignItems: "center",
            }}
          >
            {alert ? `${percent}%` : chargingAlert ? `${percent}%` : standbyBorderEnabled ? `${percent}%` : cameraAlert ? "Camera" : microphoneAlert ? "Microphone" : bluetoothAlert ? "Connected" : weather.temp ? (
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <WeatherIcon status={weather.status} size={14} color={textColor} />
                <span>{weather.temp}º</span>
              </div>
            ) : `${percent}%`}
          </h1>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
