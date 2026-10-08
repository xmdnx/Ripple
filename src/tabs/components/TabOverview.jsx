import { Zap } from "lucide-react";
import { useSetting } from "../../hooks/useSetting";
import { WeatherIcon } from "../../ui/icons";
import { formatDateShort } from "../../utils/format";

export function TabOverview({ time, percent, charging, weather }) {
  const [bgColor] = useSetting("bgColor");
  const [textColor] = useSetting("textColor");

  return (
    <>
      <div id="battery" style={{ animation: "none" }}>
        <div
          id="battery-bar"
          style={{
            backgroundColor: textColor,
            color: bgColor,
          }}
        >
          <h1 className="text" style={{ animation: "none", display: "flex", alignItems: "center", gap: 2 }}>
            {charging && <Zap size={16} />}
            <span>{percent}%</span>
          </h1>
        </div>
      </div>
      <h1
        className="text"
        style={{
          fontSize: 15,
          left: 25,
          top: 14,
          position: "absolute",
          animation: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <WeatherIcon status={weather.status} size={16} color={textColor} />
          <span>{weather.temp ? weather.temp : "??"}º</span>
        </div>
      </h1>
      <div id="date">
        <h1 className="text" style={{ fontSize: 50, animation: "none" }}>
          {time}
        </h1>
        <h2 className="text" style={{ fontSize: 15, animation: "none" }}>
          {formatDateShort()}
        </h2>
      </div>
    </>
  );
}
