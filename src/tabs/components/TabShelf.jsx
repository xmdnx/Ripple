import { useState } from "react";
import { FolderDown, Trash2, Copy, Check, ExternalLink, File, FileText, Image as ImageIcon, Globe, AlignLeft } from "lucide-react";
import { useSetting } from "../../hooks/useSetting";

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function TabShelf({ shelf }) {
  const [textColor] = useSetting("textColor");
  const [theme] = useSetting("theme");
  const [copiedId, setCopiedId] = useState(null);

  const items = shelf?.items || [];

  const handleCopy = (id, textToCopy) => {
    if (!textToCopy) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const handleOpen = (item) => {
    if (item.type === "url" && item.content) {
      window.electronAPI?.openExternal?.(item.content);
    } else if (item.path) {
      window.electronAPI?.openPath?.(item.path);
    }
  };

  const handleItemDragStart = (e, item) => {
    e.dataTransfer.setData("ripple-shelf-drag", "1");

    if (item.type === "text" || item.type === "url") {
      const textData = item.content || "";
      e.dataTransfer.setData("text/plain", textData);
      e.dataTransfer.setData("text", textData);
      if (item.type === "url") {
        e.dataTransfer.setData("text/uri-list", textData);
      }
      e.dataTransfer.effectAllowed = "copyMove";
      return;
    }

    if (item.path && window.electronAPI?.startDrag) {
      e.preventDefault();
      window.electronAPI.startDrag({
        file: item.path,
        path: item.path,
        name: item.name,
        type: item.type,
      });
      return;
    }

    if (item.path) {
      e.dataTransfer.setData("text/plain", item.path);
      e.dataTransfer.setData("text/uri-list", `file://${item.path}`);
    }
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div id="shelf" style={{ animation: "none", color: textColor }}>
      {/* Header bar */}
      <div className="shelf-header">
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <FolderDown size={15} color={textColor} />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.2px" }}>Shelf</span>
          <span className="shelf-badge">{items.length}</span>
        </div>
        {items.length > 0 && (
          <button
            className="shelf-clear-btn"
            onClick={shelf?.clearShelf}
            title="Clear all items"
            style={{ color: textColor }}
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Content list */}
      <div className="shelf-list">
        {items.length === 0 ? (
          <div className="shelf-empty">
            <div className="shelf-empty-icon">
              <FolderDown size={28} color={textColor} style={{ opacity: 0.5 }} />
            </div>
            <p className="shelf-empty-title">Shelf is empty</p>
            <p className="shelf-empty-subtitle">Drag and drop text, photos, or files onto the island</p>
          </div>
        ) : (
          items.map((item) => {
            const isCopied = copiedId === item.id;
            return (
              <div
                className="shelf-row"
                key={item.id}
                draggable
                onDragStart={(e) => {
                  if (e.target.closest("button")) {
                    e.preventDefault();
                    return;
                  }
                  handleItemDragStart(e, item);
                }}
              >
                {/* Left Preview / Icon */}
                <div className="shelf-item-preview">
                  {item.type === "image" && item.preview ? (
                    <img
                      src={item.preview}
                      alt={item.name}
                      className="shelf-thumb"
                    />
                  ) : item.type === "image" ? (
                    <ImageIcon size={20} color={textColor} opacity={0.8} />
                  ) : item.type === "url" ? (
                    <Globe size={20} color={textColor} opacity={0.8} />
                  ) : item.type === "file" ? (
                    <FileText size={20} color={textColor} opacity={0.8} />
                  ) : (
                    <AlignLeft size={20} color={textColor} opacity={0.8} />
                  )}
                </div>

                {/* Main Body */}
                <div className="shelf-item-body">
                  {item.type === "text" || item.type === "url" ? (
                    <p className="shelf-item-text" title={item.content}>
                      {item.content}
                    </p>
                  ) : (
                    <>
                      <p className="shelf-item-name" title={item.path || item.name}>
                        {item.name}
                      </p>
                      {item.size ? (
                        <span className="shelf-item-meta">{formatBytes(item.size)}</span>
                      ) : null}
                    </>
                  )}
                </div>

                {/* Right Action buttons */}
                <div className="shelf-item-actions">
                  {(item.path || item.type === "url") && (
                    <button
                      className="shelf-action-btn"
                      onClick={() => handleOpen(item)}
                      title={item.type === "url" ? "Open URL" : "Open File"}
                      style={{ color: textColor }}
                    >
                      <ExternalLink size={13} />
                    </button>
                  )}
                  <button
                    className="shelf-action-btn"
                    onClick={() => handleCopy(item.id, item.content || item.path || item.name)}
                    title="Copy"
                    style={{ color: textColor }}
                  >
                    {isCopied ? <Check size={13} color="#6fff7b" /> : <Copy size={13} />}
                  </button>
                  <button
                    className="shelf-action-btn shelf-delete-btn"
                    onClick={() => shelf?.removeItem(item.id)}
                    title="Remove"
                    style={{ color: textColor }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
