import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface Empresa {
    id: string;
    razonSocial: string;
    rfc: string;
}

interface EmpresaContextType {
    empresa: Empresa | null;
    seleccionarEmpresa: (empresa: Empresa) => void;
    listaEmpresas: Empresa[];
    loading: boolean;
    refreshEmpresas: () => Promise<void>;
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

export function EmpresaProvider({ children }: { children: ReactNode }) {
    const [empresa, setEmpresa] = useState<Empresa | null>(() => {
        // Persistencia básica al iniciar
        const stored = localStorage.getItem('sentinel_empresa_activa');
        return stored ? JSON.parse(stored) : null;
    });

    const [listaEmpresas, setListaEmpresas] = useState<Empresa[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshEmpresas = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/empresas');
            setListaEmpresas(res.data);

            // Si no hay empresa seleccionada pero hay empresas disponibles, seleccionar la primera
            if (!empresa && res.data.length > 0) {
                seleccionarEmpresa(res.data[0]);
            }
        } catch (error) {
            console.error('Error cargando empresas:', error);
            // Fallback silencioso o manejo de errores UI
        } finally {
            setLoading(false);
        }
    };

    const seleccionarEmpresa = (nuevaEmpresa: Empresa) => {
        setEmpresa(nuevaEmpresa);
        localStorage.setItem('sentinel_empresa_activa', JSON.stringify(nuevaEmpresa));

        // También sincronizar con la key antigua que usaban otras páginas por compatibilidad
        localStorage.setItem('empresaSeleccionada', nuevaEmpresa.id);

        // Disparar evento custom para componentes legacy que no usan Context
        window.dispatchEvent(new Event('empresaChanged'));
    };

    useEffect(() => {
        refreshEmpresas();
    }, []);

    return (
        <EmpresaContext.Provider value={{ empresa, seleccionarEmpresa, listaEmpresas, loading, refreshEmpresas }}>
            {children}
        </EmpresaContext.Provider>
    );
}

export function useEmpresa() {
    const context = useContext(EmpresaContext);
    if (context === undefined) {
        throw new Error('useEmpresa debe usarse dentro de un EmpresaProvider');
    }
    return context;
}
