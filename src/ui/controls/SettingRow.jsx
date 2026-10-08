export function SettingRow({ label, children, style }) {
  return (
    <div className="settings-row" style={style}>
      {label && <span className="settings-label">{label}</span>}
      {children}
    </div>
  );
}
