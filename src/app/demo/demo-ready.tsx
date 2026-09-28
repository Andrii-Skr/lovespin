"use client";

import { useEffect } from "react";

export function DemoReady() {
  useEffect(() => {
    if (window.parent === window) return;
    const origin = process.env.NODE_ENV === "production"
      ? "https://justours.love"
      : "http://127.0.0.1:3400";
    window.parent.postMessage({ type: "justours:demo-ready", version: 1, app: "lovespin" }, origin);
  }, []);

  return null;
}
