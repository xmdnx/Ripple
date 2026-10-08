import { useState, useEffect, useRef } from "react";

export function useDeviceAlerts() {
  const [bluetooth, setBluetooth] = useState(false);
  const [bluetoothAlert, setBluetoothAlert] = useState(false);
  const [cameraInUse, setCameraInUse] = useState(false);
  const [cameraAlert, setCameraAlert] = useState(false);
  const [microphoneInUse, setMicrophoneInUse] = useState(false);
  const [microphoneAlert, setMicrophoneAlert] = useState(false);

  const captureAlertQueue = useRef([]);
  const captureAlertTimer = useRef(null);
  const captureAlertDisplayed = useRef({ camera: false, microphone: false });

  // Bluetooth initial check & fallback monitoring
  useEffect(() => {
    if (window.electronAPI?.onDevicesUpdated) {
      // Handled reactively by hardware devices listener
      return;
    }

    const fetchBluetooth = async () => {
      if (window.electronAPI?.getBluetoothStatus) {
        try {
          const isConnected = await window.electronAPI.getBluetoothStatus();
          setBluetooth(isConnected);
        } catch (e) {
          console.error(e);
        }
      }
    };

    fetchBluetooth();
    const interval = setInterval(fetchBluetooth, 5000);
    return () => clearInterval(interval);
  }, []);

  const isInitialBluetooth = useRef(true);
  useEffect(() => {
    if (isInitialBluetooth.current) {
      isInitialBluetooth.current = false;
      return;
    }
    if (bluetooth) {
      setBluetoothAlert(true);
      const timerId = setTimeout(() => {
        setBluetoothAlert(false);
      }, 3000);
      return () => clearTimeout(timerId);
    }
  }, [bluetooth]);

  // Hardware devices (camera, mic, bluetooth) monitoring
  useEffect(() => {
    const triggerCaptureAlert = (type) => {
      if (captureAlertDisplayed.current[type]) return;
      captureAlertDisplayed.current[type] = true;
      captureAlertQueue.current.push(type);

      const processQueue = () => {
        if (captureAlertQueue.current.length === 0) return;
        const currentAlert = captureAlertQueue.current.shift();
        if (currentAlert === "camera") {
          setCameraAlert(true);
        } else if (currentAlert === "microphone") {
          setMicrophoneAlert(true);
        }

        captureAlertTimer.current = setTimeout(() => {
          setCameraAlert(false);
          setMicrophoneAlert(false);
          if (captureAlertQueue.current.length > 0) {
            processQueue();
          }
        }, 1500);
      };

      if (!cameraAlert && !microphoneAlert) {
        processQueue();
      }
    };

    const handleDeviceUpdate = (status) => {
      if (!status) return;
      if (status.bluetooth !== undefined) {
        setBluetooth(Boolean(status.bluetooth));
      }
      if (status.camera && !cameraInUse) {
        triggerCaptureAlert("camera");
      }
      if (status.microphone && !microphoneInUse) {
        triggerCaptureAlert("microphone");
      }
      if (!status.camera) captureAlertDisplayed.current.camera = false;
      if (!status.microphone) captureAlertDisplayed.current.microphone = false;
      setCameraInUse(Boolean(status.camera));
      setMicrophoneInUse(Boolean(status.microphone));
    };

    // Reactive push listener from D-Bus / PipeWire
    if (window.electronAPI?.onDevicesUpdated) {
      const unsubscribe = window.electronAPI.onDevicesUpdated(handleDeviceUpdate);
      return () => {
        unsubscribe();
        if (captureAlertTimer.current) clearTimeout(captureAlertTimer.current);
      };
    }

    // Fallback polling for other platforms
    const checkDevices = async () => {
      try {
        const [cam, mic, bt] = await Promise.all([
          window.electronAPI?.getCameraStatus ? window.electronAPI.getCameraStatus() : false,
          window.electronAPI?.getMicrophoneStatus ? window.electronAPI.getMicrophoneStatus() : false,
          window.electronAPI?.getBluetoothStatus ? window.electronAPI.getBluetoothStatus() : false,
        ]);
        handleDeviceUpdate({ camera: cam, microphone: mic, bluetooth: bt });
      } catch (e) {
        console.error(e);
      }
    };

    checkDevices();
    const interval = setInterval(checkDevices, 2000);
    return () => {
      clearInterval(interval);
      if (captureAlertTimer.current) clearTimeout(captureAlertTimer.current);
    };
  }, [cameraInUse, microphoneInUse]);

  return {
    bluetooth,
    bluetoothAlert,
    cameraInUse,
    cameraAlert,
    microphoneInUse,
    microphoneAlert,
  };
}
