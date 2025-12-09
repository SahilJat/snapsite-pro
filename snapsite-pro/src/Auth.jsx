import { useState } from "react";

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const endpoint = isLogin ? "/login" : "/register";

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentiction failed");
      if (isLogin) {
        onLogin(data.token);

      } else {
        alert("Registeration successfull ! Please login");
        setIsLogin(true);
      }
    }
    catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex justify-center items-center">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-sm border border-gray-700">
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          {isLogin ? "👷 Site Access" : "📝 New Engineer"}
        </h2>

        {error && <p className="text-red-400 text-center text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email" placeholder="Email" required
            value={email} onChange={e => setEmail(e.target.value)}
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="password" placeholder="Password" required
            value={password} onChange={e => setPassword(e.target.value)}
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded transition">
            {isLogin ? "Enter Site" : "Register"}
          </button>
        </form>

        <p className="text-gray-400 text-center mt-4 text-sm">
          {isLogin ? "Need access?" : "Have an ID?"}
          <button onClick={() => setIsLogin(!isLogin)} className="text-emerald-400 ml-2 hover:underline">
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
export default Auth;

