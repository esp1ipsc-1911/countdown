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

  // 🔊 ONE MINUTE voice
  function speakOneMinute() {
    if ("speechSynthesis" in window) {
      const msg = new SpeechSynthesisUtterance("ONE MINUTE");

      msg.lang = "en-US";
      msg.volume = 1;
      msg.rate = 0.9;
      msg.pitch = 1;

      speechSynthesis.cancel();
      speechSynthesis.speak(msg);
    }
  }

  // 🔥 EKSTREMT TYDELIG SLUTTALARM
  function loudAlarm() {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const now = ctx.currentTime;

    function tone(freq, start, duration, volume = 0.7) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration + 0.02);
    }

    tone(1200, now + 0.0, 0.25);
    tone(900, now + 0.3, 0.25);
    tone(1200, now + 0.6, 0.25);
    tone(900, now + 0.9, 0.25);
    tone(1400, now + 1.2, 0.5);
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
    // 🔊 ONE MINUTE
    if (isRunning && timeLeft === 60 && !oneMinutePlayed.current) {
      oneMinutePlayed.current = true;
      speakOneMinute();
    }

    // 🔥 SLUTTALARM
    if (timeLeft === 0 && !finishedPlayed.current) {
      finishedPlayed.current = true;
      loudAlarm();
    }
  }, [timeLeft, isRunning]);

  const selectedMinutes = duration / 60;

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

        <section className="timer-card">
          <h2>{timeLeft === 0 ? "Time out" : "Time left"}</h2>

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
