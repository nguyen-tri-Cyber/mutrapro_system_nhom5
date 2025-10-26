// web-app/src/App.js
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// === 1. IMPORT CÁC THÀNH PHẦN CỦA TOASTIFY ===
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// ===============================================

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import CreateOrderPage from './pages/CreateOrderPage';
import TaskListPage from './pages/TaskListPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import ProfilePage from './pages/ProfilePage';
import StudioBookingPage from './pages/StudioBookingPage';
import StudioAdminDashboard from './pages/StudioAdminDashboard';
import './App.css';

function App() {
  return (
    <div className="app-background">
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Các trang công khai */}
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            
            {/* Các trang cần bảo vệ */}
            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="orders/new" element={<CreateOrderPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="studio/booking" element={<StudioBookingPage />} />
              <Route path="orders/:orderId" element={<OrderDetailsPage />} />
              <Route path="orders/history" element={<OrderHistoryPage />} />
              <Route path="tasks" element={<TaskListPage />} />
              <Route path="admin/studios" element={<StudioAdminDashboard />} />
            </Route>
          </Route>
        </Routes>
      </Router>

      {/* === 2. THÊM BỘ HIỂN THỊ THÔNG BÁO VÀO ĐÂY === */}
      {/* Nó sẽ "lắng nghe" và hiển thị mọi thông báo được gọi từ bất kỳ đâu trong app */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      {/* ============================================== */}
    </div> 
  );
}

export default App;