import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ExpedientesPage from './pages/ExpedientesPage';
import BancosPage from './pages/BancosPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/expedientes" element={<ExpedientesPage />} />
                <Route path="/bancos" element={<BancosPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
