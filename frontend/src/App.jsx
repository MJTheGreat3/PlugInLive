import { BrowserRouter, Routes, Route, Link } from "react-router-dom"


import Auth from "./components/Auth"
import Dashboard from "./components/Dashboard"
import supabase from "./components/SupabaseClient";

function App() {
    const handleLogout = async () => {
        await supabase.auth.signOut();
        setSession(null);
    };
    
  return (
    <BrowserRouter>
      <nav>
        <h1>Interview Assessor</h1>
        <Link to="/">Dashboard</Link>
        <Link to="/login">Login</Link>
        <button onClick={handleLogout}>Logout</button>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Auth />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;