import { BrowserRouter, Routes, Route, Link } from "react-router-dom"
import Dashboard from "./components/Dashboard"
import supabase from "./components/SupabaseClient";
import LoginRegister from "./components/LoginRegister";
import { SessionProvider } from "./components/SessionContext";

function App() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };


  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<LoginRegister />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  );
}

export default App;
