import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical, Eye, EyeOff, Star, ChevronLeft, Plus, Trash2 } from "lucide-react";
import { useSetting } from "../../hooks/useSetting";
import { SettingSection } from "../../ui/controls/SettingSection";
import { SettingRow } from "../../ui/controls/SettingRow";
import { SettingToggle } from "../../ui/controls/SettingToggle";
import { SettingSelect } from "../../ui/controls/SettingSelect";
import { TABS } from "../../constants/tabs";

export function TabSettings({
  displays = [],
  currentDisplayId,
  onDisplayChange,
  theme,
  setTheme,
}) {
  const [hourFormatSetting, setHourFormatSetting] = useSetting("hourFormat");
  const [autoLaunchEnabled, setAutoLaunchEnabled] = useSetting("autoLaunch");
  const [tabOrder, setTabOrder] = useSetting("tabOrder");
  const [hiddenTabs, setHiddenTabs] = useSetting("hiddenTabs");
  const [defaultTabId, setDefaultTabId] = useSetting("defaultTab");
  const [positionMode, setPositionMode] = useSetting("positionMode");
  const [islandX, setIslandX] = useSetting("islandX");
  const [islandY, setIslandY] = useSetting("islandY");
  const [bgColor, setBgColor] = useSetting("bgColor");
  const [textColor, setTextColor] = useSetting("textColor");
  const [bgImage, setBgImage] = useSetting("bgImage");
  const [weatherLocation, setWeatherLocation] = useSetting("weatherLocation");
  const [weatherUnit, setWeatherUnit] = useSetting("weatherUnit");
  const [quickApps, setQuickApps] = useSetting("quickApps");
  const [workflows, setWorkflows] = useSetting("workflows");
  const [mediaArtworkRadius, setMediaArtworkRadius] = useSetting("mediaArtworkRadius");

  const [newQuickApp, setNewQuickApp] = useState("");
  const [appSuggestions, setAppSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const selectedAppRef = useRef(null);
  const appSearchTimer = useRef(null);

  const [workflowName, setWorkflowName] = useState("");
  const [workflowUrls, setWorkflowUrls] = useState("");

  const isFree = positionMode === "free";

  const moveTabOrder = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= tabOrder.length) return;
    const newOrder = [...tabOrder];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);
    setTabOrder(newOrder);
  };

  const toggleTabVisibility = (id) => {
    const newHidden = hiddenTabs.includes(id)
      ? hiddenTabs.filter((t) => t !== id)
      : [...hiddenTabs, id];
    setHiddenTabs(newHidden);
  };

  const addQuickApp = () => {
    if (!newQuickApp.trim()) return;
    const launch = selectedAppRef.current ? selectedAppRef.current.launch : newQuickApp.trim();
    const updated = [...quickApps, { name: newQuickApp.trim(), launch }];
    setQuickApps(updated);
    setNewQuickApp("");
    selectedAppRef.current = null;
    setShowSuggestions(false);
  };

  const removeQuickApp = (idx) => {
    setQuickApps(quickApps.filter((_, i) => i !== idx));
  };

  const handleQaChange = (idx, newName) => {
    const updated = [...quickApps];
    updated[idx] = { ...updated[idx], name: newName };
    setQuickApps(updated);
  };

  const addWorkflow = () => {
    if (workflowName.trim() && workflowUrls.trim()) {
      const urls = workflowUrls
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean);
      const newWorkflow = { name: workflowName.trim(), urls };
      setWorkflows([...workflows, newWorkflow]);
      setWorkflowName("");
      setWorkflowUrls("");
    }
  };

  const removeWorkflow = (index) => {
    setWorkflows(workflows.filter((_, i) => i !== index));
  };

  return (
    <div id="settings-container">
      <SettingSection title="General">
        <SettingRow label="12/24 Hour Format">
          <SettingSelect
            settingKey="hourFormat"
            options={[
              { value: "12-hr", label: "12-hour" },
              { value: "24-hr", label: "24-hour" },
            ]}
          />
        </SettingRow>

        {window.electronAPI?.platform !== "darwin" && (
          <SettingToggle
            settingKey="autoLaunch"
            label="Auto Launch on Boot"
            onChange={(val) => {
              setAutoLaunchEnabled(val);
              if (window.electronAPI?.setAutoLaunch) {
                window.electronAPI.setAutoLaunch(val);
              }
            }}
          />
        )}

        {displays.length > 0 && (
          <SettingRow label="Target Display">
            <select value={currentDisplayId} onChange={onDisplayChange}>
              {displays.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </SettingRow>
        )}
      </SettingSection>

      <SettingSection title="Tab Management">
        <p style={{ fontSize: 11, opacity: 0.4, marginTop: -8, marginBottom: 8 }}>
          Drag to reorder, click eye to hide.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {tabOrder.map((id, i) => {
            const tabDef = TABS.find((t) => t.id === id);
            if (!tabDef) return null;
            const isHidden = hiddenTabs.includes(id);
            return (
              <div
                key={id}
                className={`tab-order-item ${isHidden ? "hidden" : ""}`}
                style={{ cursor: "grab" }}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", i);
                  e.currentTarget.style.opacity = "0.4";
                  e.currentTarget.style.borderStyle = "dashed";
                }}
                onDragEnd={(e) => {
                  e.currentTarget.style.opacity = isHidden ? "0.45" : "1";
                  e.currentTarget.style.borderStyle = isHidden ? "dashed" : "solid";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.background = `color-mix(in srgb, ${textColor}, transparent 90%)`;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.background = "";
                  e.currentTarget.style.transform = "";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.background = "";
                  e.currentTarget.style.transform = "";
                  const fromIdx = parseInt(e.dataTransfer.getData("text/plain"));
                  moveTabOrder(fromIdx, i);
                }}
              >
                <GripVertical size={16} style={{ opacity: 0.3, cursor: "grab" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                  {tabDef.icon(textColor)}
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{tabDef.name}</span>
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <button
                    className="tab-order-btn"
                    onClick={() => setDefaultTabId(id)}
                    title="Set as default"
                    style={{
                      opacity: defaultTabId === id ? 1 : 0.3,
                      color: defaultTabId === id ? "#FFD700" : textColor,
                    }}
                  >
                    <Star size={16} fill={defaultTabId === id ? "#FFD700" : "none"} />
                  </button>
                  <div
                    style={{
                      width: 1,
                      height: 16,
                      background: textColor,
                      opacity: 0.1,
                      margin: "0 4px",
                    }}
                  />
                  <button
                    className="tab-order-btn"
                    onClick={() => toggleTabVisibility(id)}
                    title={isHidden ? "Show" : "Hide"}
                    style={{ opacity: isHidden ? 1 : 0.6 }}
                  >
                    {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <div
                    style={{
                      width: 1,
                      height: 16,
                      background: textColor,
                      opacity: 0.1,
                      margin: "0 4px",
                    }}
                  />
                  <button
                    className="tab-order-btn"
                    disabled={i === 0}
                    onClick={() => moveTabOrder(i, i - 1)}
                  >
                    <ChevronLeft size={16} style={{ transform: "rotate(90deg)" }} />
                  </button>
                  <button
                    className="tab-order-btn"
                    disabled={i === tabOrder.length - 1}
                    onClick={() => moveTabOrder(i, i + 1)}
                  >
                    <ChevronLeft size={16} style={{ transform: "rotate(-90deg)" }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </SettingSection>

      <SettingSection title="Island Style">
        <SettingRow label="Theme">
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="none">Default</option>
            <option value="sleek-black">Sleek Black</option>
            <option value="win95">Windows 95</option>
          </select>
        </SettingRow>

        <div
          className="settings-section"
          style={{
            alignItems: "center",
            background: "rgba(255,255,255,0.03)",
            padding: "15px",
            borderRadius: "18px",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <span
            className="settings-label"
            style={{ textAlign: "center", marginBottom: "8px", opacity: 1, color: textColor }}
          >
            Position Mode
          </span>
          <div
            className="radio-group"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              width: "100%",
              gap: "15px 10px",
            }}
          >
            {[
              { val: "top-left", label: "Top L" },
              { val: "top-center", label: "Top C" },
              { val: "top-right", label: "Top R" },
              { val: "bottom-left", label: "Bot L" },
              { val: "bottom-center", label: "Bot C" },
              { val: "bottom-right", label: "Bot R" },
            ].map((m) => (
              <label key={m.val} className="radio-label" style={{ justifyContent: "center" }}>
                <input
                  type="radio"
                  name="positionMode"
                  value={m.val}
                  checked={positionMode === m.val}
                  onChange={(e) => setPositionMode(e.target.value)}
                />
                <span className="radio-custom"></span>
                {m.label}
              </label>
            ))}
          </div>
          <div
            style={{
              width: "100%",
              height: "1px",
              background: "rgba(255,255,255,0.1)",
              margin: "10px 0",
            }}
          ></div>
          <label className="radio-label" style={{ justifyContent: "center" }}>
            <input
              type="radio"
              name="positionMode"
              value="free"
              checked={positionMode === "free"}
              onChange={(e) => setPositionMode(e.target.value)}
            />
            <span className="radio-custom"></span>
            FREE (MANUAL)
          </label>
        </div>

        <AnimatePresence>
          {isFree && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              style={{ overflow: "hidden", display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <SettingRow label={`Position X (${islandX.toFixed(1)}%)`}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.5"
                  value={islandX}
                  onChange={(e) => setIslandX(parseFloat(e.target.value))}
                />
              </SettingRow>
              <SettingRow label={`Position Y (${islandY}px)`}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={islandY}
                  onChange={(e) => setIslandY(parseInt(e.target.value))}
                />
              </SettingRow>
            </motion.div>
          )}
        </AnimatePresence>

        <SettingRow label="Background Color">
          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
        </SettingRow>
        <SettingRow label="Text Color">
          <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
        </SettingRow>
        <SettingRow label="Background Image">
          <input
            className="select-input"
            placeholder="Image URL or none"
            value={bgImage}
            onChange={(e) => setBgImage(e.target.value)}
          />
        </SettingRow>

        <SettingToggle settingKey="islandBorder" label="Border Outline" />
      </SettingSection>

      <SettingSection title="Now Playing Island">
        <SettingRow label="Max Island Width">
          <SettingSelect
            settingKey="mediaMaxIslandWidth"
            options={[
              { value: 260, label: "Compact (260px)" },
              { value: 300, label: "Standard (300px)" },
              { value: 360, label: "Wide (360px)" },
              { value: 420, label: "Extra Wide (420px)" },
              { value: 500, label: "Full Dynamic (500px)" },
            ]}
          />
        </SettingRow>
        <SettingToggle settingKey="mediaMarqueeEnabled" label="Marquee Text Scroll" />
        <SettingToggle settingKey="mediaShowArtwork" label="Show Album Artwork" />
        <SettingRow label={`Artwork Corner Radius (${Number(mediaArtworkRadius) >= 13 ? "Circle" : `${mediaArtworkRadius ?? 6}px`})`}>
          <input
            type="range"
            min="0"
            max="13"
            step="1"
            value={mediaArtworkRadius ?? 6}
            onChange={(e) => setMediaArtworkRadius(parseInt(e.target.value, 10))}
          />
        </SettingRow>
      </SettingSection>

      <SettingSection title="Features">
        <SettingToggle settingKey="batteryAlerts" label="Low Battery Alerts" />
        <SettingToggle settingKey="standbyMode" label="Standby Mode" />
        <SettingToggle settingKey="largeStandbyMode" label="Large Standby Mode" />
        <SettingToggle settingKey="showInfoWhenIdle" label="Show Info when idle" />
      </SettingSection>

      <SettingSection title="Weather">
        <SettingRow label="Location">
          <input
            className="select-input"
            placeholder="City, ST, Country"
            value={weatherLocation}
            onChange={(e) => setWeatherLocation(e.target.value)}
          />
        </SettingRow>
        <SettingRow label="Unit">
          <SettingSelect
            settingKey="weatherUnit"
            options={[
              { value: "f", label: "Fahrenheit (°F)" },
              { value: "c", label: "Celsius (°C)" },
            ]}
          />
        </SettingRow>
      </SettingSection>

      <SettingSection title="Quick Apps">
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "12px",
            position: "relative",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              className="select-input"
              style={{ flex: 1 }}
              value={newQuickApp}
              placeholder="Add app (e.g. Apple Music)"
              onChange={(e) => {
                const val = e.target.value;
                setNewQuickApp(val);
                selectedAppRef.current = null;
                clearTimeout(appSearchTimer.current);
                if (window.electronAPI?.platform === "win32" && val.trim().length > 1) {
                  appSearchTimer.current = setTimeout(async () => {
                    const results = await window.electronAPI.searchApps(val.trim());
                    setAppSuggestions(results);
                    setShowSuggestions(results.length > 0);
                  }, 200);
                } else {
                  setAppSuggestions([]);
                  setShowSuggestions(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") addQuickApp();
                if (e.key === "Escape") setShowSuggestions(false);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            />
            <button
              onClick={addQuickApp}
              style={{
                backgroundColor: textColor,
                color: bgColor,
                border: "none",
                borderRadius: "12px",
                padding: "8px 12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus size={18} />
            </button>
          </div>

          {showSuggestions && appSuggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 999,
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                backgroundColor: bgColor,
                border: `1px solid ${textColor}22`,
                marginTop: "4px",
              }}
            >
              {appSuggestions.map((s, i) => (
                <div
                  key={i}
                  onMouseDown={() => {
                    selectedAppRef.current = s;
                    setNewQuickApp(s.name);
                    setShowSuggestions(false);
                  }}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    color: textColor,
                    fontSize: 13,
                    borderBottom: i < appSuggestions.length - 1 ? `1px solid ${textColor}11` : "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${textColor}11`)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div
                    style={{
                      opacity: 0.4,
                      fontSize: 11,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.launch}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <AnimatePresence>
            {quickApps.map((app, idx) => (
              <motion.div
                key={`qa-${idx}`}
                className="settings-row"
                style={{ justifyContent: "space-between", padding: "5px 0" }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, x: -20, height: 0, padding: 0 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  className="select-input"
                  style={{ flex: 1, border: "none", background: "transparent", padding: 0 }}
                  value={app.name}
                  onChange={(e) => handleQaChange(idx, e.target.value)}
                />
                <button
                  onClick={() => removeQuickApp(idx)}
                  style={{
                    color: "#ff4d4d",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </SettingSection>

      <SettingSection title="Manage Workflows" style={{ marginBottom: 30 }}>
        <div
          id="add-workflow-form"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <span className="settings-label" style={{ opacity: 0.8 }}>
            Workflow Name
          </span>
          <input
            className="select-input"
            style={{ width: "100%", boxSizing: "border-box" }}
            placeholder="e.g. Work Tools"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
          />
          <span className="settings-label" style={{ marginTop: 15, opacity: 0.8 }}>
            Apps or URLs (Comma Separated)
          </span>
          <textarea
            className="select-input"
            style={{ width: "100%", minHeight: "50px", padding: "8px", boxSizing: "border-box" }}
            placeholder="e.g. Spotify, docs.google.com"
            value={workflowUrls}
            onChange={(e) => setWorkflowUrls(e.target.value)}
          />
          <button
            onClick={addWorkflow}
            style={{
              backgroundColor: textColor,
              color: bgColor,
              border: "none",
              borderRadius: "12px",
              padding: "8px",
              fontWeight: 600,
              cursor: "pointer",
              marginTop: 2,
            }}
          >
            Save Workflow
          </button>
        </div>

        <div id="workflows-list" style={{ marginTop: "15px" }}>
          <AnimatePresence>
            {workflows.map((wf, idx) => (
              <motion.div
                key={`wf-${wf.name}-${idx}`}
                className="settings-row"
                style={{
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: `1px solid color-mix(in srgb, ${textColor}, transparent 95%)`,
                }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, x: -20, height: 0, padding: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    paddingRight: "10px",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{wf.name}</span>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>{wf.urls.length} items</span>
                </div>
                <button
                  onClick={() => removeWorkflow(idx)}
                  style={{
                    color: "#ff4d4d",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <Trash2 size={14} />
                  <span style={{ fontSize: 12 }}>Remove</span>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </SettingSection>
    </div>
  );
}
