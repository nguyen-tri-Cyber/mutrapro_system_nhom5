// web-app/src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext(null);

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // 1. Thêm state `loading` để biết khi nào đang kiểm tra localStorage
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
            try {
                const userObject = JSON.parse(storedUser);
                setUser(userObject);
            } catch (error) {
                console.error("Failed to parse user from localStorage", error);
                localStorage.removeItem('user');
            }
        }
        // 2. Dù có user hay không, sau khi kiểm tra xong thì phải hết loading
        setLoading(false); 
    }, []);

    const login = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    // 3. Cung cấp cả `loading` ra ngoài
    const value = { user, login, logout, loading };

    return (
        <AuthContext.Provider value={value}>
            {/* 4. Chỉ render App khi đã hết loading */}
            {!loading && children}
        </AuthContext.Provider>
    );
};