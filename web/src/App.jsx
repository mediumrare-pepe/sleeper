import { Link, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import './App.css';

export default function App() {
  return (
    <>
      <nav className="nav">
        <Link to="/">Dashboard</Link>
        <Link to="/logs">Logs</Link>
        <Link to="/settings">Settings</Link>
      </nav>
      <div className="page">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </>
  );
}
