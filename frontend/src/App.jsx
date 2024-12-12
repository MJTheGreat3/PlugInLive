import { BrowserRouter, Routes, Route } from "react-router-dom"
import Dashboard from "./components/Dashboard"
import LoginRegister from "./components/LoginRegister";
import { SessionProvider } from "./components/SessionContext";
import Reports from "./components/Reports";

function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<LoginRegister />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  );
}

export default App;
