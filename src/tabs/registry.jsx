import { Search, Zap, Sun, Music, List, Check, Settings } from "lucide-react";
import { TabSearch } from "./components/TabSearch";
import { TabWorkflows } from "./components/TabWorkflows";
import { TabOverview } from "./components/TabOverview";
import { TabMedia } from "./components/TabMedia";
import { TabClipboard } from "./components/TabClipboard";
import { TabTasks } from "./components/TabTasks";
import { TabSettings } from "./components/TabSettings";

export const TAB_REGISTRY = [
  {
    id: 0,
    name: "Browser Search",
    icon: (color) => <Search size={16} color={color} />,
    dimensions: { width: 405, height: 120 },
    Component: TabSearch,
  },
  {
    id: 1,
    name: "Workflows & QA",
    icon: (color) => <Zap size={16} color={color} />,
    dimensions: { width: 480, height: 210 },
    Component: TabWorkflows,
  },
  {
    id: 2,
    name: "Overview",
    icon: (color) => <Sun size={16} color={color} />,
    dimensions: { width: 380, height: 190 },
    Component: TabOverview,
  },
  {
    id: 3,
    name: "Now Playing",
    icon: (color) => <Music size={16} color={color} />,
    dimensions: { width: 330, height: 150 },
    Component: TabMedia,
  },
  {
    id: 5,
    name: "Clipboard",
    icon: (color) => <List size={16} color={color} />,
    dimensions: { width: 380, height: 190 },
    Component: TabClipboard,
  },
  {
    id: 6,
    name: "Tasks",
    icon: (color) => <Check size={16} color={color} />,
    dimensions: { width: 380, height: 250 },
    Component: TabTasks,
  },
  {
    id: 7,
    name: "Settings",
    icon: (color) => <Settings size={16} color={color} />,
    dimensions: (ctx) => ({
      width: 495,
      height: ctx?.positionMode === "free" ? 425 : 345,
    }),
    Component: TabSettings,
  },
];

export const getTabById = (id) => TAB_REGISTRY.find((t) => t.id === id);
