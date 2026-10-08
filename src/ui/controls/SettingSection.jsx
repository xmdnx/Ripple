export function SettingSection({ title, children, style }) {
  return (
    <div className="settings-section" style={style}>
      {title && (
        <h3 style={{ fontSize: 13, textTransform: "uppercase", opacity: 0.5, letterSpacing: "0.05em" }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
