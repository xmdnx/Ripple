import { useState, useEffect } from "react";
import { useSetting } from "./useSetting";

export function useBattery() {
  const [percent, setPercent] = useState(null);
  const [charging, setCharging] = useState(false);
  const [alert, setAlert] = useState(false);
  const [chargingAlert, setChargingAlert] = useState(false);
  const [batteryAlertsEnabled] = useSetting("batteryAlerts");

  useEffect(() => {
    let battery;
    let handler;
    let intervalId;

    const queryNativeBattery = async () => {
      if (window.electronAPI?.getBatteryStatus) {
        try {
          const status = await window.electronAPI.getBatteryStatus();
          if (status && typeof status.percent === "number") {
            setPercent(status.percent);
            setCharging(Boolean(status.charging));
            return true;
          }
        } catch (_) {}
      }
      return false;
    };

    (async () => {
      const nativeHandled = await queryNativeBattery();
      if (nativeHandled) {
        intervalId = setInterval(queryNativeBattery, 10000);
        return;
      }

      if (!("getBattery" in navigator)) {
        return;
      }
      try {
        battery = await navigator.getBattery();
        const update = () => {
          setPercent(Math.round(battery.level * 100));
          setCharging(battery.charging);
        };
        handler = update;
        update();
        battery.addEventListener("chargingchange", handler);
        battery.addEventListener("levelchange", handler);
      } catch (_) {}
    })();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (battery && handler) {
        battery.removeEventListener("levelchange", handler);
        battery.removeEventListener("chargingchange", handler);
      }
    };
  }, []);

  useEffect(() => {
    if (
      (percent === 20 || percent === 15 || percent === 10 || percent === 5 || percent === 3) &&
      batteryAlertsEnabled
    ) {
      setAlert(true);
      const timerId = setTimeout(() => {
        setAlert(false);
      }, 3000);
      return () => clearTimeout(timerId);
    }
  }, [percent, batteryAlertsEnabled]);

  useEffect(() => {
    if (charging && batteryAlertsEnabled) {
      setChargingAlert(true);
      const timerId = setTimeout(() => {
        setChargingAlert(false);
      }, 1500);
      return () => clearTimeout(timerId);
    }
  }, [charging, batteryAlertsEnabled]);

  return { percent, charging, alert, chargingAlert };
}
