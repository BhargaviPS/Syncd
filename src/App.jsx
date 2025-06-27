// App.js – Full code with working phase logic, mood chart, journal history

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
} from 'chart.js';
import './App.css';
import {
  auth,
  signInAnonymously,
  db,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  analytics,
  logEvent
} from './firebase';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

// Phase logic
function getCurrentPhase(cycleStart, today, avgCycle = 28) {
  const start = new Date(cycleStart);
  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  const day = diffDays % avgCycle;

  if (day < 5) return 'Menstruation';
  if (day >= 14 && day <= 16) return 'Ovulation';
  if (day > 5 && day < 14) return 'Follicular Phase';
  return 'Luteal Phase';
}

const promptList = [
  "Write one thing you love about your body.",
  "What emotion are you feeling most today?",
  "Name something you're grateful for this week."
];

export default function App() {
  const today = new Date();
  const [userId, setUserId] = useState('');
  const [cycleStart, setCycleStart] = useState('');
  const [avgCycle, setAvgCycle] = useState(28);
  const [nextPeriod, setNextPeriod] = useState('');
  const [phase, setPhase] = useState('');
  const [mood, setMood] = useState('');
  const [journal, setJournal] = useState('');
  const [theme, setTheme] = useState('light');
  const [showPCOSAlert, setShowPCOSAlert] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [journalHistory, setJournalHistory] = useState([]);
  const [moodHistory, setMoodHistory] = useState([]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Auth and Load Data
  useEffect(() => {
    const authenticate = async () => {
      try {
        const userCred = await signInAnonymously(auth);
        const user = userCred.user;
        setUserId(user.uid);

        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCycleStart(data.cycleStart || '');
          setAvgCycle(data.avgCycle || 28);
          setMood(data.mood || '');
          setJournal(data.journal || '');
          setJournalHistory(data.journalHistory || []);
          setMoodHistory(data.moodHistory || []);
        }
      } catch (err) {
        console.error("Auth error:", err);
      } finally {
        setLoadingUser(false);
      }
    };

    authenticate();
  }, []);

  // Save Data
  const saveUserData = async () => {
    if (!userId || !cycleStart) {
      alert("User not signed in or cycle start is missing.");
      return;
    }

    try {
      const date = new Date().toISOString().split('T')[0];
      const newEntry = { date, mood, journal };
      const updatedJournal = [...journalHistory, newEntry].slice(-12);
      const updatedMood = [...moodHistory, { date, mood }].slice(-12);

      setJournalHistory(updatedJournal);
      setMoodHistory(updatedMood);

      const payload = {
        cycleStart,
        avgCycle,
        mood,
        journal,
        journalHistory: updatedJournal,
        moodHistory: updatedMood
      };

      const userRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) await setDoc(userRef, payload);
      else await updateDoc(userRef, payload);

      logEvent(analytics, 'manual_save_clicked', { user_id: userId });
      alert("Data saved successfully!");
    } catch (err) {
      console.error("Failed to save:", err);
      alert("Something went wrong while saving.");
    }
  };

  // Phase Prediction and PCOS Alert
  useEffect(() => {
    if (cycleStart && avgCycle) {
      const next = new Date(cycleStart);
      next.setDate(next.getDate() + Number(avgCycle));
      setNextPeriod(next.toDateString());
      setPhase(getCurrentPhase(cycleStart, today, avgCycle));

      const cycleHistory = JSON.parse(localStorage.getItem('history') || '[]');
      if (cycleHistory.length >= 3) {
        const lengths = cycleHistory.map(c => c.length);
        const max = Math.max(...lengths);
        const min = Math.min(...lengths);
        const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
        setShowPCOSAlert((max - min > 7) || avg > 35 || avg < 21);
      }
    }
  }, [cycleStart, avgCycle]);

  const moodChartData = {
    labels: moodHistory.map(m => m.date),
    datasets: [
      {
        label: 'Mood Score (length of word)',
        data: moodHistory.map(m => m.mood.length),
        fill: false,
        borderColor: '#e91e63'
      }
    ]
  };

  if (loadingUser) return <div className="app"><p>🔄 Loading...</p></div>;

  return (
    <div className={`app ${theme === 'dark' ? 'dark' : ''}`}>
      <h1>Sync'd – Period Tracker</h1>

      <button onClick={toggleTheme}>
        Switch to {theme === 'light' ? 'Blood Red' : 'Light'} Mode
      </button>

      <label>Start Date of Last Period:</label>
      <input type="date" value={cycleStart} onChange={e => setCycleStart(e.target.value)} />

      <label>Average Cycle Length (days):</label>
      <input type="number" value={avgCycle} min="21" max="35" onChange={e => setAvgCycle(e.target.value)} />

      <label>Today's Mood:</label>
      <input value={mood} onChange={e => setMood(e.target.value)} placeholder="e.g. tired, anxious, calm..." />

      <label>Journal Prompt:</label>
      <p><i>{promptList[new Date().getDate() % promptList.length]}</i></p>
      <textarea value={journal} onChange={e => setJournal(e.target.value)} placeholder="Your thoughts..." />

      <button onClick={saveUserData} disabled={!userId || !cycleStart}>💾 Save</button>

      {cycleStart && (
        <div className="results">
          <p><strong>Current Phase:</strong> {phase}</p>
          <p><strong>Next Predicted Period:</strong> {nextPeriod}</p>
        </div>
      )}

      {showPCOSAlert && (
        <div className="alert">
          ⚠️ Your cycle seems irregular. Please consult a doctor.
        </div>
      )}

      {journalHistory.length > 0 && (
        <div className="journal-history">
          <h3>📝 Journal History</h3>
          <ul>
            {journalHistory.map((entry, i) => (
              <li key={i}><strong>{entry.date}:</strong> {entry.journal}</li>
            ))}
          </ul>
        </div>
      )}

      {moodHistory.length > 1 && (
        <div className="mood-chart">
          <h3>📈 Mood Chart</h3>
          <Line data={moodChartData} />
        </div>
      )}

      {adminStats && (
        <div className="admin">
          <h3>Admin Stats</h3>
          <p>Total Users: {adminStats.totalUsers}</p>
          <p>Most Common Mood: {adminStats.topMood}</p>
        </div>
      )}

      <footer>
        <small>Made with ❤️ by Bhargavi • Firebase synced</small>
      </footer>
    </div>
  );
}

