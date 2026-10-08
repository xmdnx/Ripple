import { Search, Zap, Sun, Music, Mic, List, Check, Settings } from "lucide-react";

export const TABS = [
  { id: 0, name: "Browser Search", icon: (color) => <Search size={16} color={color} /> },
  { id: 1, name: "Workflows & QA", icon: (color) => <Zap size={16} color={color} /> },
  { id: 2, name: "Overview", icon: (color) => <Sun size={16} color={color} /> },
  { id: 3, name: "Now Playing", icon: (color) => <Music size={16} color={color} /> },
  // { id: 4, name: "AI Assistant", icon: (color) => <Mic size={16} color={color} /> },
  { id: 5, name: "Clipboard", icon: (color) => <List size={16} color={color} /> },
  { id: 6, name: "Tasks", icon: (color) => <Check size={16} color={color} /> },
  { id: 7, name: "Settings", icon: (color) => <Settings size={16} color={color} /> },
];