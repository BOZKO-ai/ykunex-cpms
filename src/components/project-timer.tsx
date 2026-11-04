"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Clock, Check } from "lucide-react";
import { useToast } from "./toast";

export function ProjectTimer({ projectId, projectName }: { projectId: number; projectName: string }) {
  const { success, info } = useToast();
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const storageKey = `yakunex-timer-${projectId}`;

  // Restore timer state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.startTime && data.isActive) {
          const elapsed = Math.floor((Date.now() - data.startTime) / 1000) + (data.baseSeconds || 0);
          setSeconds(elapsed);
          setIsActive(true);
        } else {
          setSeconds(data.baseSeconds || 0);
          setIsActive(false);
        }
      }
    } catch {}
  }, [storageKey]);

  // Interval loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const toggleTimer = () => {
    if (!isActive) {
      // Starting
      const now = Date.now();
      localStorage.setItem(storageKey, JSON.stringify({ startTime: now, baseSeconds: seconds, isActive: true }));
      setIsActive(true);
      info(`Timer started for "${projectName}"`);
    } else {
      // Pausing
      localStorage.setItem(storageKey, JSON.stringify({ baseSeconds: seconds, isActive: false }));
      setIsActive(false);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setSeconds(0);
    localStorage.removeItem(storageKey);
  };

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleLogHours = async () => {
    if (seconds < 60) {
      alert("Please track at least 1 minute before logging.");
      return;
    }

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const timeFormatted = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} minutes`;

    const note = prompt(`Log work session for "${projectName}" (${timeFormatted}):\nEnter a brief note on what you worked on:`, `Worked on project tasks (${timeFormatted})`);
    if (!note) return;

    setIsLogging(true);
    try {
      const fd = new FormData();
      fd.append("note", `⏱️ [Time Log: ${timeFormatted}] ${note}`);

      const res = await fetch(`/api/projects/${projectId}/time`, {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
        success(`Successfully logged ${timeFormatted} to project updates!`);
        resetTimer();
        window.location.reload();
      } else {
        // Fallback: reload to trigger standard revalidation
        resetTimer();
        window.location.reload();
      }
    } catch {
      resetTimer();
      window.location.reload();
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="project-timer-widget">
      <div className="timer-info">
        <span className="timer-label">
          <Clock size={14} className={isActive ? "animate-spin-slow" : ""} />
          Time Tracker
        </span>
        <div className="timer-digits">
          {formatTime(seconds)}
          {isActive && <span className="timer-live-dot" />}
        </div>
      </div>

      <div className="timer-controls">
        <button 
          onClick={toggleTimer} 
          className={`btn-timer-action ${isActive ? "btn-timer-pause" : "btn-timer-play"}`}
          title={isActive ? "Pause Timer" : "Start Timer"}
        >
          {isActive ? <Pause size={14} /> : <Play size={14} />}
          {isActive ? "Pause" : "Start"}
        </button>

        {seconds > 0 && (
          <>
            <button 
              onClick={handleLogHours} 
              className="btn-timer-action btn-timer-log"
              disabled={isLogging}
              title="Log time to project updates"
            >
              <Check size={14} /> Log Time
            </button>
            <button 
              onClick={resetTimer} 
              className="btn-timer-action btn-timer-reset"
              title="Reset Timer"
            >
              <RotateCcw size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

