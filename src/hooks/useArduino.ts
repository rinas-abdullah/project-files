"use client";

import { useState, useRef } from "react";

export interface ArduinoData {
  temp: number;
  pressure: number;
  steps: number;
}

// Minimal shape of the Web Serial API's SerialPort, which isn't part of TS's default DOM lib.
interface WebSerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
}

export function useArduino() {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState<ArduinoData | null>(null);
  const portRef = useRef<WebSerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);

  const connect = async () => {
    if (!("serial" in navigator)) {
      alert("عذراً، متصفحك لا يدعم تقنية Web Serial API. يرجى استخدام متصفح Chrome أو Edge حديث.");
      return;
    }

    try {
      // @ts-expect-error - Web Serial API types aren't in the default DOM lib
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      setIsConnected(true);

      // Start reading
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        buffer += value;
        
        // Parse complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ""; // keep incomplete line in buffer

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine) {
            try {
              // Expected format from Arduino: {"temp": 37.1, "pressure": 110, "steps": 5}
              const parsed = JSON.parse(cleanLine) as ArduinoData;
              setData(parsed);
            } catch (err) {
              console.log("Could not parse Arduino data:", cleanLine);
            }
          }
        }
      }
    } catch (err) {
      console.error("Arduino connection error:", err);
      setIsConnected(false);
    }
  };

  const disconnect = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
      }
      if (portRef.current) {
        await portRef.current.close();
      }
      setIsConnected(false);
      setData(null);
    } catch (err) {
      console.error("Error disconnecting:", err);
    }
  };

  return {
    isConnected,
    data,
    connect,
    disconnect
  };
}
