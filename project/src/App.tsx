import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import { Web3Provider } from './context/Web3Context';
import { EmissionUnitProvider } from './context/EmissionUnitContext';

function App() {
  return (
    <EmissionUnitProvider>
    <Web3Provider>
      <Router>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetails />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </Web3Provider>
    </EmissionUnitProvider>
  );
}

export default App;