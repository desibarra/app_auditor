import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EmpresaProvider } from './context/EmpresaContext';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ExpedientesPage from './pages/ExpedientesPage';
import BancosPage from './pages/BancosPage';
import ListaDevolucionesPage from './pages/ListaDevolucionesPage';
import DetalleDevolucionPage from './pages/DetalleDevolucionPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import AuditoriaDetalladaPage from './pages/AuditoriaDetalladaPage';

function App() {
    return (
        <EmpresaProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/auditoria" element={<AuditoriaDetalladaPage />} />
                    <Route path="/config" element={<ConfiguracionPage />} />
                    <Route path="/expedientes" element={<ExpedientesPage />} />
                    <Route path="/devoluciones" element={<ListaDevolucionesPage />} />
                    <Route path="/devoluciones/:id" element={<DetalleDevolucionPage />} />
                    <Route path="/bancos" element={<BancosPage />} />
                </Routes>
            </BrowserRouter>
        </EmpresaProvider>
    );
}

export default App;
