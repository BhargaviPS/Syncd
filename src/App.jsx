import React, { useState, useEffect } from 'react';
import './App.css';
import {
  auth,
  signInAnonymously,
  onAuthStateChanged,
  db,
  doc,
  setDoc,
  getDoc,
  analytics,
  logEvent
} from './firebase';

function getCurrentPhase(cycleStart, today, avgCycle = 28) {
  const daysSinceStart = Math.floor((today - new Date(cycleStart)) / (1000 * 60 * 60 * 24));
  const dayOfCycle = daysSinceStart % avgCycle;
  if (dayOfCycle < 5) return 'Menstruation';
  if (dayOfCycle >= 14 && dayOfCycle <= 16) return 'Ovulation';
  if (dayOfCycle > 5 && dayOfCycle < 14) return 'Follicular Phase';
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

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  useEffect(() => {
    signInAnonymously(auth).then(() => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUserId(user.uid);
          const docSnap = await getDoc(doc(db, 'users', user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCycleStart(data.cycleStart);
            setAvgCycle(data.avgCycle);
            setMood(data.mood || '');
            setJournal(data.journal || '');
          }
        }
      });
    });
  }, []);

  useEffect(() => {
    if (cycleStart) {
      const next = new Date(cycleStart);
      next.setDate(next.getDate() + Number(avgCycle));
      setNextPeriod(next.toDateString());
      setPhase(getCurrentPhase(cycleStart, today, avgCycle));

      const cycleHistory = JSON.parse(localStorage.getItem('history') || '[]');
      if (cycleHistory.length >= 3) {
        const lengths = cycleHistory.map(c => c.length);
        const max = Math.max(...lengths);
        const min = Math.min(...lengths);
        if (max - min > 7) setShowPCOSAlert(true);
      }

      if (userId) {
        setDoc(doc(db, 'users', userId), {
          cycleStart,
          avgCycle,
          mood,
          journal
        });
        logEvent(analytics, 'cycle_updated', { user_id: userId, start_date: cycleStart, cycle_length: avgCycle });
      }
    }
  }, [cycleStart, avgCycle, mood, journal, userId]);

  useEffect(() => {
    const ADMIN_UID = 'YOUR_UID_HERE';
    if (userId === ADMIN_UID) {
      setAdminStats({ totalUsers: 18, topMood: 'Tired' }); // placeholder
    }
  }, [userId]);

  return (
    <div className={`app ${theme === 'dark' ? 'dark' : ''}`}>
      <h1>Sync'd – Period Tracker</h1>

      <button onClick={toggleTheme}>
        Switch to {theme === 'light' ? 'Blood Red' : 'Light'} Mode
      </button>

      <label>Start Date of Last Period:</label>
      <input type="date" value={cycleStart} onChange={(e) => setCycleStart(e.target.value)} />

      <label>Average Cycle Length (days):</label>
      <input type="number" value={avgCycle} min="21" max="35" onChange={(e) => setAvgCycle(e.target.value)} />

      <label>Today's Mood:</label>
      <input value={mood} onChange={(e) => setMood(e.target.value)} placeholder="e.g. tired, anxious, calm..." />

      <label>Journal Prompt:</label>
      <p><i>{promptList[new Date().getDate() % promptList.length]}</i></p>
      <textarea value={journal} onChange={(e) => setJournal(e.target.value)} placeholder="Your thoughts..." />

      {cycleStart && (
        <div className="results">
          <p><strong>Current Phase:</strong> {phase}</p>
          <p><strong>Next Predicted Period:</strong> {nextPeriod}</p>
        </div>
      )}

      {showPCOSAlert && (
        <div className="alert">
          ⚠️ Irregular cycle detected. Consider consulting a doctor.
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
