import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function App() {
  const [duration, setDuration] = useState(5 * 60);
  const [timeLeft, setTimeLeft] = useState(5 * 60);
  const [isRunning, setIsRunning] = useState(false);

  const audioContextRef = useRef(null);
  const oneMinutePlayed = useRef(false);
  const finishedPlayed = useRef(false);

  function unlockAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!audioContextRef.current && AudioContext) {
      audioContextRef.current = new AudioContext();
    }

    if (audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume();
    }
  }

  function beep(freq = 880, length = 0.25) {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.value = freq;
    osc.type = "sine";

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + length);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + length + 0.05);
  }

  function selectTime(minutes) {
    const seconds = minutes * 60;

    setDuration(seconds);
    setTimeLeft(seconds);
    setIsRunning(false);

    oneMinutePlayed.current = false;
    finishedPlayed.current = false;
  }

  function startPause() {
    unlockAudio();

    if (timeLeft === 0) {
      setTimeLeft(duration);
      oneMinutePlayed.current = false;
      finishedPlayed.current = false;
      setIsRunning(true);
      return;
    }

    setIsRunning((prev) => !prev);
  }

  function resetTimer() {
    setIsRunning(false);
    setTimeLeft(duration);

    oneMinutePlayed.current = false;
    finishedPlayed.current = false;
  }

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (isRunning && timeLeft === 60 && !oneMinutePlayed.current) {
      oneMinutePlayed.current = true;

      beep(740, 0.25);
      setTimeout(() => beep(740, 0.25), 350);
    }

    if (timeLeft === 0 && !finishedPlayed.current) {
      finishedPlayed.current = true;

      beep(950, 0.3);
      setTimeout(() => beep(760, 0.3), 400);
      setTimeout(() => beep(950, 0.4), 800);
    }
  }, [timeLeft, isRunning]);

  const selectedMinutes = duration / 60;
  const isLastMinute = timeLeft > 0 && timeLeft <= 60;

  return (
    <div className="app">
      <main className="phone">
        <header className="header">
          <h1>Insight Dynamics Shooting</h1>
          <p>Walkthrough - countdown</p>
        </header>

        <section className="time-selector">
          {[5, 4, 3].map((min) => (
            <button
              key={min}
              onClick={() => selectTime(min)}
              className={selectedMinutes === min ? "active" : ""}
            >
              {min} min
            </button>
          ))}
        </section>

        <section className={isLastMinute ? "timer-card warning" : "timer-card"}>
          <h2>
            {timeLeft === 0
              ? "Time out"
              : isLastMinute
              ? "Last minute"
              : "Time left"}
          </h2>

          <div className="time">{formatTime(timeLeft)}</div>

          <div className="line" />

          <div className="info">
            <div>
              <span>Selected</span>
              <strong>{selectedMinutes}</strong>
              <small>min</small>
            </div>

            <div>
              <span>Alarm</span>
              <strong>1:00</strong>
              <small>min</small>
            </div>
          </div>

          <h3>
            Status:{" "}
            {isRunning ? "Running" : timeLeft === 0 ? "Finished" : "Ready"}
          </h3>
        </section>

        <button className="reset" onClick={resetTimer}>
          RESET TIMER
        </button>

        <button
          className={isRunning ? "main-button pause" : "main-button"}
          onClick={startPause}
        >
          {isRunning ? "PAUSE" : timeLeft === 0 ? "RESTART" : "START"}
        </button>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
