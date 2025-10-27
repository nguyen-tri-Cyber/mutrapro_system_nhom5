// web-app/src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. Tạo và EXPORT trực tiếp Context (named export)
export const AuthContext = createContext(null);

// Hook tùy chỉnh để sử dụng context dễ dàng hơn sau này
export const useAuth = () => {
    return useContext(AuthContext);
};

// 2. Tạo và EXPORT Provider (named export)
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        
        // --- PHẦN NÂNG CẤP BẢO VỆ ---
        if (storedUser) {
            try {
                // Thử chuyển đổi chuỗi từ localStorage thành object
                const userObject = JSON.parse(storedUser);
                setUser(userObject);
            } catch (error) {
                // Nếu thất bại (do chuỗi không phải JSON hợp lệ),
                // thì log lỗi và xóa cái dữ liệu rác đó đi.
                console.error("Failed to parse user from localStorage", error);
                localStorage.removeItem('user');
            }
        }
        // --- KẾT THÚC PHẦN NÂNG CẤP ---

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