import { createContext, useContext, useState, useEffect } from 'react'; // 1. Import useEffect
import type { ReactNode } from 'react';

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
    const [loading, setLoading] = useState<boolean>(true); // Start as true

    useEffect(() => {
        try {
            // Check localStorage for a saved user session
            const storedUser = sessionStorage.getItem('tathip-user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            // Ensure user is logged out if localStorage is corrupt
            setUser(null);
        } finally {
            // IMPORTANT: Set loading to false after the check is complete
            setLoading(false);
        }
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