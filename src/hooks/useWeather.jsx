// src/hooks/useWeather.js
import { useState, useEffect } from "react";

export function useWeather() {
  const [weather, setWeather] = useState({ temp: "", status: "" });
  const [weatherUnit, setWeatherUnit] = useState(
    () => localStorage.getItem("weather-unit") || "f"
  );

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=0b18c67c443543e0a6045401250911&q=${localStorage.getItem(
            "location"
          )}&aqi=no`
        );
        const data = await response.json();
        const unit = localStorage.getItem("weather-unit");
        const key = unit === "f" ? "temp_f" : "temp_c";
        setWeather({
          temp: Math.round(data?.current?.[key]),
          status: data?.current?.condition?.text || ""
        });
      } catch (e) {
        console.error("Weather fetch failed", e);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // каждые 10 мин
    return () => clearInterval(interval);
  }, [weatherUnit]);

  return { weather, weatherUnit, setWeatherUnit };
}