import { useSetting } from "../../hooks/useSetting";

export function SettingSelect({ settingKey, options = [], value, onChange, style }) {
  const [storeVal, setStoreVal] = useSetting(settingKey);
  const currentVal = value !== undefined ? value : storeVal;

  const handleChange = (e) => {
    let val = e.target.value;
    if (val === "true") val = true;
    else if (val === "false") val = false;
    
    if (onChange) {
      onChange(val);
    } else {
      setStoreVal(val);
    }
  };

  return (
    <select value={String(currentVal)} onChange={handleChange} style={style}>
      {options.map((opt) => (
        <option key={String(opt.value)} value={String(opt.value)}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
