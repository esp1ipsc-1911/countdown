import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const m = Math.floor(safeSeconds / 60);
  const s = safeSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getProgress(duration, timeLeft) {
  if (!duration || duration <= 0) return 0;
  const value = ((duration - timeLeft) / duration) * 100;
  return Math.min(100, Math.max(0, value));
}

function runTimerSelfTests() {
  console.assert(formatTime(300) === "5:00", "formatTime should format 5 minutes");
  console.assert(formatTime(60) === "1:00", "formatTime should format 1 minute");
  console.assert(formatTime(0) === "0:00", "formatTime should format zero");
  console.assert(getProgress(300, 300) === 0, "progress should be 0 at start");
  console.assert(getProgress(300, 0) === 100, "progress should be 100 at finish");
}

runTimerSelfTests();

function App() {
  const [duration, setDuration] = useState(5 * 60);
  const [timeLeft, setTimeLeft] = useState(5 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const oneMinuteAlarmPlayed = useRef(false);
  const endAlarmPlayed = useRef(false);
  const audioContextRef = useRef(null);

  const playTone = (frequency, startTime, durationSeconds, volume = 0.24) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + durationSeconds);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + durationSeconds + 0.03);
  };

  const playBeep = (frequency = 880, durationSeconds = 0.18, volume = 0.22) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    playTone(frequency, ctx.currentTime, durationSeconds, volume);
  };

  const unlockAudio = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioContextRef.current && AudioContext) {
        audioContextRef.current = new AudioContext();
      }
      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume();
      }
      setAudioReady(true);
      playBeep(660, 0.08, 0.04);
    } catch (error) {
      console.warn("Audio could not be initialized", error);
    }
  };

  const playOneMinuteAlarm = () => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    playTone(740, now, 0.18);
    playTone(740, now + 0.28, 0.18);
  };

  const playEndAlarm = () => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    playTone(950, now, 0.22);
    playTone(760, now + 0.32, 0.22);
    playTone(950, now + 0.64, 0.22);
    playTone(760, now + 0.96, 0.35);
  };

  const selectDuration = (minutes) => {
    const seconds = minutes * 60;
    setDuration(seconds);
    setTimeLeft(seconds);
    setIsRunning(false);
    oneMinuteAlarmPlayed.current = false;
    endAlarmPlayed.current = false;
  };

  const startStopTimer = () => {
    unlockAudio();
    if (timeLeft === 0) {
      setTimeLeft(duration);
      oneMinuteAlarmPlayed.current = false;
      endAlarmPlayed.current = false;
      setIsRunning(true);
      return;
    }
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
    oneMinuteAlarmPlayed.current = false;
    endAlarmPlayed.current = false;
  };

  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(interval);
          setIsRunning(false);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (isRunning && timeLeft === 60 && !oneMinuteAlarmPlayed.current) {
      oneMinuteAlarmPlayed.current = true;
      playOneMinuteAlarm();
    }

    if (timeLeft === 0 && !endAlarmPlayed.current) {
      endAlarmPlayed.current = true;
      playEndAlarm();
    }
  }, [timeLeft, isRunning]);

  const minutesSelected = duration / 60;
  const isFinalMinute = timeLeft > 0 && timeLeft <= 60;
  const progress = getProgress(duration, timeLeft);

  return (
    <main className="app-shell">
      <section className="phone-frame">
        <header className="status-row">
          <div className="clock">23:13</div>
          <div className="dynamic-island"><span>∞</span></div>
          <div className="battery-row"><span className="orange-dot" /><span className="signal">▮▮▮</span><span className="battery">86</span></div>
        </header>

        <div className="title-row">
          <h1>IPSC INSIGHT TIMER</h1>
          <button className="settings-button" onClick={unlockAudio} aria-label="Aktiver lyd">⚙</button>
        </div>

        <nav className="segment-control" aria-label="Velg tid">
          {[5, 4, 3].map((minutes) => (
            <button key={minutes} onClick={() => selectDuration(minutes)} className={minutesSelected === minutes ? "active" : ""}>
              {minutes} min
            </button>
          ))}
        </nav>

        <section className={`timer-card ${isFinalMinute ? "warning" : ""}`}>
          <h2>{timeLeft === 0 ? "Time out" : isFinalMinute ? "Last minute" : "Time left"}</h2>
          <div className="timer-display">{formatTime(timeLeft)}</div>
          <div className="progress-track"><div className="progress-bar" style={{ width: `${progress}%` }} /></div>
          <div className="info-grid">
            <div><p>Selected</p><strong>{minutesSelected}</strong></div>
            <div><p>Alarm</p><strong>1:00</strong></div>
          </div>
          <div className="status-text">Status: {isRunning ? "Running" : timeLeft === 0 ? "Finished" : "Ready"}</div>
        </section>

        <button className="reset-button" onClick={resetTimer}>RESET TIMER</button>

        <div className="spacer" />

        <footer className="bottom-panel">
          <button className={`main-button ${isRunning ? "pause" : timeLeft === 0 ? "restart" : "start"}`} onClick={startStopTimer}>
            {isRunning ? "PAUSE" : timeLeft === 0 ? "RESTART" : "START"}
          </button>
          <div className="audio-status">🔊 {audioReady ? "Lyd aktivert" : "Trykk START for å aktivere lyd på iPhone"}</div>
        </footer>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
