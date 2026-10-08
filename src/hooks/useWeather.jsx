import { useState, useEffect } from "react";
import { useSetting } from "./useSetting";

export function useWeather() {
  const [weather, setWeather] = useState({ temp: "", status: "" });
  const [weatherUnit, setWeatherUnit] = useSetting("weatherUnit");
  const [weatherLocation] = useSetting("weatherLocation");

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        if (!weatherLocation) return;
        const response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=0b18c67c443543e0a6045401250911&q=${encodeURIComponent(
            weatherLocation
          )}&aqi=no`
        );
        const data = await response.json();
        const key = weatherUnit === "f" ? "temp_f" : "temp_c";
        setWeather({
          temp: Math.round(data?.current?.[key]),
          status: data?.current?.condition?.text || ""
        });
      } catch (e) {
        console.error("Weather fetch failed", e);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, [weatherUnit, weatherLocation]);

  return { weather, weatherUnit, setWeatherUnit };
}
