import { useState, useEffect } from 'react';
import Auth from './Auth';

function App() {
  const [token, setToken] = useState(localStorage.getItem('site_token'));
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");


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

  useEffect(() => {
    if (token) fetchTasks();
    // CRITICAL: This effect runs again if 'searchTerm' or 'filterPriority' changes!
  }, [token, searchTerm, filterPriority]);

  const fetchTasks = async () => {
    try {
      // Build the URL with query params
      // Encodes spaces/symbols correctly (e.g., "buy cement" -> "buy%20cement")
      const query = new URLSearchParams({
        search: searchTerm,
        priority: filterPriority
      }).toString();

      const res = await fetch(`http://localhost:5000/tasks?${query}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.status === 401) return handleLogout();

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
  if (!token) return <Auth onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-10 flex justify-center">
      <div className="w-full max-w-md bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 relative">

        {/* Header & Logout */}
        <button onClick={handleLogout} className="absolute top-4 right-4 text-xs text-gray-400 hover:text-white">Logout ➡️</button>
        <h1 className="text-2xl font-bold text-center mb-6 text-emerald-400">🏗️ Pro Site Manager</h1>

        {/* --- NEW: SEARCH & FILTER BAR --- */}
        <div className="flex gap-2 mb-4">
          {/* Search Input */}
          <input
            type="text"
            placeholder="🔍 Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-gray-700 border border-gray-600 rounded p-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
          />

          {/* Filter Dropdown */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded p-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
          >
            <option value="All">All Levels</option>
            <option value="Normal">📌 Normal</option>
            <option value="High">🔥 High</option>
          </select>
        </div>

        {/* ADD TASK FORM */}
        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Log new task..."
          />
          <button className="bg-emerald-600 hover:bg-emerald-500 px-5 rounded-lg font-bold">Add</button>
        </form>

        {/* TASK LIST */}
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-center text-gray-500 text-sm italic">No tasks found matching filters.</p>
          ) : (
            tasks.map(task => (
              <div key={task.id} className={`flex justify-between items-center p-4 rounded-lg border ${task.priority === "High" ? "bg-red-900/20 border-red-500/50" : "bg-gray-700 border-gray-600"
                }`}>
                <span
                  onClick={() => handleToggle(task.id, task.priority)}
                  className="cursor-pointer font-medium hover:text-white transition"
                >
                  {task.priority === "High" ? "🔥 " : "📌 "} {task.text}
                </span>
                <button onClick={() => handleDelete(task.id)} className="text-gray-400 hover:text-red-400">✕</button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}

export default App;
