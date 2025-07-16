import { createContext, useContext, useState, useEffect } from 'react'; // 1. Import useEffect
import type { ReactNode } from 'react';
import axios from '../utils/axiosInstance';

// --- Interfaces remain the same ---
interface Credentials {
    username: string;
    password: string;
}

interface User {
    id: string;
    username: string;
    role?: string;
    // Add other user properties as needed
}

interface AuthContextType {
    userInfo: User | null;
    loading: boolean;
    action: {
        login: (credentials: Credentials) => void;
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

    const login = async (credentials: Credentials) => {
        try {
            const response = await axios.post('auths/login', credentials);
            setUser(response.data);
            return response.data; // return ข้อมูลผู้ใช้
        } catch (error) {
            throw error; // throw error ให้ component จัดการ
        }
    };

    const logout = () => {
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