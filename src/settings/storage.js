export const DEFAULT_SETTINGS = {
  // General
  hourFormat: "12-hr",
  autoLaunch: false,
  targetDisplay: "",
  positionMode: "free",
  islandX: 50,
  islandY: 20,

  // Appearance
  theme: "default",
  bgColor: "#000000",
  textColor: "#FFFFFF",
  bgImage: "none",
  islandBorder: false,
  standbyMode: false,
  largeStandbyMode: false,
  hideNotActiveIsland: false,
  showInfoWhenIdle: true,

  // Alerts
  batteryAlerts: true,

  // Tabs
  tabOrder: [0, 1, 2, 3, 5, 6, 7],
  hiddenTabs: [],
  defaultTab: 2,

  // Quick Apps & Workflows & Tasks
  quickApps: [
    { name: "Notes", launch: "Notes" },
    { name: "Spotify", launch: "Spotify" },
    { name: "Calculator", launch: "Calculator" },
    { name: "Terminal", launch: "Terminal" }
  ],
  workflows: [],
  tasks: [],

  // Now Playing Island Adaptations
  mediaMaxIslandWidth: 360,
  mediaMarqueeEnabled: true,
  mediaShowArtwork: true,
  mediaArtworkRadius: 6,

  // Weather
  weatherUnit: "f",
  weatherLocation: "",

  // System flags
  newUser: true,
};

const STORAGE_KEY = "ripple-settings";

let memoryStore = { ...DEFAULT_SETTINGS };
const listeners = new Set();
let saveTimeout = null;

export const SettingsEngine = {
  init() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        memoryStore = { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  },

  get(key) {
    return memoryStore[key] ?? DEFAULT_SETTINGS[key];
  },

  getAll() {
    return memoryStore;
  },

  set(key, value) {
    if (memoryStore[key] === value) return;
    memoryStore = { ...memoryStore, [key]: value };
    this.notify();
    this.debouncedSave();
  },

  debouncedSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      this.saveNow();
    }, 150);
  },

  saveNow() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  },

  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  notify() {
    listeners.forEach((cb) => cb());
  },
};

SettingsEngine.init();
