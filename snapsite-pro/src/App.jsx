import { useState, useEffect } from 'react';
import Auth from './Auth';

function App() {
  const [token, setToken] = useState(localStorage.getItem('site_token'));
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");

  // 1. SAVE TOKEN ON LOGIN
  const handleLogin = (newToken) => {
    localStorage.setItem('site_token', newToken); // Save to browser storage
    setToken(newToken);
  };

  // 2. LOGOUT
  const handleLogout = () => {
    localStorage.removeItem('site_token');
    setToken(null);
    setTasks([]);
  };

  // 3. FETCH (Now with Headers!)
  useEffect(() => {
    if (token) fetchTasks();
  }, [token]);

  const fetchTasks = async () => {
    try {
      const res = await fetch("http://localhost:5000/tasks", {
        headers: { "Authorization": `Bearer ${token}` } // SHOW ID CARD
      });
      if (res.status === 401 || res.status === 403) return handleLogout(); // Expired ID
      const data = await res.json();
      setTasks(data);
    } catch (err) { console.error(err); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!input) return;
    const res = await fetch("http://localhost:5000/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` // SHOW ID CARD
      },
      body: JSON.stringify({ text: input })
    });
    const newTask = await res.json();
    setTasks([...tasks, newTask]);
    setInput("");
  };

  // [Include Toggle/Delete functions with "Authorization" header just like handleAdd]
  // For brevity, I am skipping them, but you MUST add headers to them too!
  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/tasks/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleToggle = async (id, currentPriority) => {
    const newPriority = currentPriority === "High" ? "Normal" : "High";
    await fetch(`http://localhost:5000/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ priority: newPriority })
    });
    setTasks(tasks.map(t => t.id === id ? { ...t, priority: newPriority } : t));
  };


  // --- CONDITIONAL RENDERING ---
  // If no token, show Auth Screen
  if (!token) return <Auth onLogin={handleLogin} />;

  // If token exists, show App
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-10 flex justify-center">
      <div className="w-full max-w-md bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 relative">

        {/* Logout Button */}
        <button onClick={handleLogout} className="absolute top-4 right-4 text-xs text-gray-400 hover:text-white">
          Logout ➡️
        </button>

        <h1 className="text-2xl font-bold text-center mb-6 text-emerald-400">🏗️ Pro Site Manager</h1>

        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="New Task..."
          />
          <button className="bg-emerald-600 hover:bg-emerald-500 px-5 rounded-lg font-bold">Add</button>
        </form>

        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task.id} className="flex justify-between items-center p-4 rounded-lg bg-gray-700 border border-gray-600">
              <span
                onClick={() => handleToggle(task.id, task.priority)}
                className="cursor-pointer font-medium hover:text-white transition"
              >
                {task.priority === "High" ? "🔥 " : "📌 "} {task.text}
              </span>
              <button onClick={() => handleDelete(task.id)} className="text-gray-400 hover:text-red-400">✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App;
