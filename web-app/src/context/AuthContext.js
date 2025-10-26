// web-app/src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. Tạo và EXPORT trực tiếp Context (named export)
export const AuthContext = createContext(null);

// Hook tùy chỉnh để sử dụng context dễ dàng hơn sau này (không bắt buộc nhưng nên có)
export const useAuth = () => {
    return useContext(AuthContext);
};

// 2. Tạo và EXPORT Provider (named export)
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};