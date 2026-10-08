import { useState } from "react";
import { useSetting } from "../../hooks/useSetting";

export function TabSearch() {
  const [textColor] = useSetting("textColor");
  const [browserSearch, setBrowserSearch] = useState("");

  const searchBrowser = () => {
    const trimmed = browserSearch.trim();
    if (!trimmed) return;
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
    if (urlPattern.test(trimmed)) {
      const url = trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;
      window.electronAPI?.openExternal ? window.electronAPI.openExternal(url) : window.open(url, "_blank");
    } else {
      const encoded = encodeURIComponent(trimmed);
      const url = `https://www.google.com/search?q=${encoded}`;
      window.electronAPI?.openExternal ? window.electronAPI.openExternal(url) : window.open(url, "_blank");
    }
  };

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <input
        id="browser-searchbar"
        placeholder="Search google or enter URL"
        value={browserSearch}
        onChange={(e) => setBrowserSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            searchBrowser();
          }
        }}
        style={{ color: textColor }}
      />
    </div>
  );
}
