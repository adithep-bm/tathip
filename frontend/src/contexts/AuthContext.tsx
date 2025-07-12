import { createContext, useContext, useState, useEffect } from 'react'; // 1. Import useEffect
import type { ReactNode } from 'react';
import axios from '../utils/axiosInstance';

// --- Interfaces remain the same ---
interface User {
    id: number;
    name: string;
}

interface AuthContextType {
    userInfo: User | null;
    loading: boolean;
    action: {
        login: (userData: User) => void;
        logout: () => void;
    };
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [_user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get('/auths/me', {
                    withCredentials: true, // สำคัญ! เพื่อส่ง cookie ไปด้วย
                });
                setUser(response.data);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []); // The empty array [] ensures this effect runs only once

    const login = (userData: User) => {
        // Save user to localStorage to persist the session
        sessionStorage.setItem('tathip-user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        // Remove user from localStorage
        sessionStorage.removeItem('tathip-user');
        setUser(null);
    };

    const value = {
        userInfo: _user,
        loading,
        action: {
            login,
            logout,
        },
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- useAuth hook remains the same ---
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthProvider;