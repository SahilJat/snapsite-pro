// client/src/App.jsx
import { useState, useEffect } from 'react';
import Auth from './Auth';
import TaskItem from './components/TaskItem'; // <--- NEW IMPORT

function App() {
  // ... (Keep all state: token, tasks, input, search, filter) ...
  // [Copy-paste your existing state and useEffect logic here]
  const [token, setToken] = useState(localStorage.getItem('site_token'));
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");

  const handleLogin = (newToken) => {
    localStorage.setItem('site_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('site_token');
    setToken(null);
    setTasks([]);
  };

  useEffect(() => {
    if (token) fetchTasks();
  }, [token, searchTerm, filterPriority]);

  const fetchTasks = async () => {
    try {
      const query = new URLSearchParams({ search: searchTerm, priority: filterPriority }).toString();
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
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ text: input })
    });
    const newTask = await res.json();
    setTasks([...tasks, newTask]);
    setInput("");
  };

  // --- NEW: GENERIC UPDATE FUNCTION ---
  // This handles BOTH Priority toggle AND Text editing
  const handleUpdate = async (id, updates) => {
    // updates will be something like { priority: "High" } OR { text: "New Name" }

    try {
      await fetch(`http://localhost:5000/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(updates) // Send whatever changed
      });

      // Update UI Optimistically
      setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));

    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/tasks/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    setTasks(tasks.filter(t => t.id !== id));
  };

  if (!token) return <Auth onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-10 flex justify-center">
      <div className="w-full max-w-md bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 relative">

        <button onClick={handleLogout} className="absolute top-4 right-4 text-xs text-gray-400 hover:text-white">Logout ➡️</button>
        <h1 className="text-2xl font-bold text-center mb-6 text-emerald-400">🏗️ Pro Site Manager</h1>

        {/* Search & Filter (Keep existing code) */}
        <div className="flex gap-2 mb-4">
          <input
            type="text" placeholder="🔍 Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-gray-700 border border-gray-600 rounded p-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
          />
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="bg-gray-700 border border-gray-600 rounded p-2 text-sm outline-none">
            <option value="All">All</option>
            <option value="Normal">📌 Norm</option>
            <option value="High">🔥 High</option>
          </select>
        </div>

        {/* Add Form (Keep existing code) */}
        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input
            value={input} onChange={e => setInput(e.target.value)}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Log new task..."
          />
          <button className="bg-emerald-600 hover:bg-emerald-500 px-5 rounded-lg font-bold">Add</button>
        </form>

        {/* TASK LIST - REFACTORED */}
        <div className="space-y-3">
          {tasks.map(task => (
            // WE NOW USE THE COMPONENT INSTEAD OF RAW DIVS
            <TaskItem
              key={task.id}
              task={task}
              onUpdate={handleUpdate} // Pass the smart update function
              onDelete={handleDelete}
            />
          ))}
          {tasks.length === 0 && <p className="text-center text-gray-500 text-sm">No tasks.</p>}
        </div>

      </div>
    </div>
  );
}

export default App;
