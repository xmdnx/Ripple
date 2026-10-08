import { useState, useEffect } from "react";
import { useSetting } from "./useSetting";

export function useClock() {
  const [time, setTime] = useState(null);
  const [hourFormatSetting] = useSetting("hourFormat");
  const is12Hour = hourFormatSetting === "12-hr";

  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      if (is12Hour) {
        hours = hours % 12;
        hours = hours ? hours : 12;
      }
      setTime(`${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [is12Hour]);

  return { time, is12Hour };
}
