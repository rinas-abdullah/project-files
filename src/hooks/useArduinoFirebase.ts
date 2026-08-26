"use client";

import { useState, useEffect } from "react";
import { ref, onValue, off } from "firebase/database";
import { database } from "@/lib/firebase";

export interface ArduinoData {
  temp: number;
  pressure: number;
  steps: number;
  timestamp?: number;
}

export function useArduinoFirebase(patientId: string = "DITHAR-PAD-9842") {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState<ArduinoData | null>(null);

  useEffect(() => {
    // Reference to the specific patient's live data in Firebase Realtime Database
    const dataRef = ref(database, `patients/${patientId}/liveData`);

    // Listen for real-time changes
    const unsubscribe = onValue(dataRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setIsConnected(true);
        setData({
          temp: val.temp || 37.1,
          pressure: val.pressure || 118,
          steps: val.steps || 4281,
          timestamp: val.timestamp
        });
      } else {
        // No data found at this node
        setIsConnected(false);
      }
    }, (error) => {
      console.error("Firebase subscription error:", error);
      setIsConnected(false);
    });

    // Cleanup subscription on unmount
    return () => {
      off(dataRef, "value", unsubscribe);
    };
  }, [patientId]);

  return {
    isConnected,
    data
  };
}
