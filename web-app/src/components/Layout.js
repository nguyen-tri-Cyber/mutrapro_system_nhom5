import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <>
      {/* Navbar sẽ luôn hiển thị ở trên cùng */}
      <Navbar />
      
      {/* Nội dung của các trang con (HomePage, LoginPage,...) sẽ được render ở đây */}
      <main>
        <Outlet />
      </main>
      
      {/* (Trong tương lai, bạn có thể thêm component <Footer /> vào đây) */}
    </>
  );
};

export default Layout;