import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HSLandingPage from './pages/HSLandingPage';
import Platform from './pages/Platform';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HSLandingPage />} />
        <Route path="/platform" element={<Platform />} />
        <Route path="/app" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
