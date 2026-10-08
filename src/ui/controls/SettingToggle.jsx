import { useSetting } from "../../hooks/useSetting";
import { SettingRow } from "./SettingRow";

export function SettingToggle({ settingKey, label, value, onChange, style }) {
  const [storeVal, setStoreVal] = useSetting(settingKey);
  const currentVal = value !== undefined ? value : storeVal;

  const handleChange = (e) => {
    const val = e.target.value === "true";
    if (onChange) {
      onChange(val);
    } else {
      setStoreVal(val);
    }
  };

  return (
    <SettingRow label={label} style={style}>
      <select value={currentVal ? "true" : "false"} onChange={handleChange}>
        <option value="true">Enabled</option>
        <option value="false">Disabled</option>
      </select>
    </SettingRow>
  );
}
