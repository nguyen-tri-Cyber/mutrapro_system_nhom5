// web-app/src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import authApi from '../api/authApi'; 
export const AuthContext = createContext(null);
export const useAuth = () => {
    return useContext(AuthContext);
};
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); 

    useEffect(() => {
        const verifyUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await authApi.verifyToken();
                    // FIX LỖI CHÍNH NẰM Ở ĐÂY:
                    // Dữ liệu người dùng nằm trong response.data
                    setUser(response.data.user); 
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                } catch (error) {
                    authApi.logout();
                    setUser(null);
                    console.error("Token verification failed", error);
                }
            }
            setLoading(false);
        };
        verifyUser();
    }, []);

    const login = (userData) => {
        setUser(userData);
    };

    const logout = () => {
        authApi.logout(); 
        setUser(null);
    };

    const value = { user, login, logout, loading };

return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
