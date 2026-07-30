import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Layout from "./pages/Layout";
import Login from "./pages/Login";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import Warehouses from "./pages/Warehouses";
import Stocks from "./pages/Stocks";
import Transactions from "./pages/Transactions";
import Users from "./pages/Users";

const Dashboard = () => (
    <div className="animate-fade-in">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Tổng quan Hệ thống</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 shadow-sm">
                <h3 className="text-blue-800 font-semibold mb-2 uppercase text-sm tracking-wider">Trạng thái</h3>
                <div className="flex items-center text-green-600 font-bold text-lg mt-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></span>
                    Sẵn sàng hoạt động
                </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col justify-center items-center transition-transform hover:-translate-y-1 hover:shadow-md">
                <span className="text-4xl mb-3">📊</span>
                <p className="text-slate-600 font-semibold">WMS Dashboard</p>
                <p className="text-slate-400 text-sm mt-1">Hệ thống quản lý kho</p>
            </div>

            {/* Card 3 (Giữ chỗ) */}
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-lg p-6 flex flex-col justify-center items-center opacity-70">
                <span className="text-3xl mb-3 grayscale">🚀</span>
                <p className="text-slate-500 font-medium">Tính năng sắp tới...</p>
            </div>
        </div>
    </div>
);

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Route public không cần đăng nhập */}
                <Route path="/login" element={<Login />} />

                {/* 
                    Nhóm các Route được bảo vệ 
                    Tất cả các route con bên trong sẽ được đi qua ProtectedRoute trước, 
                    sau đó mới render vào trong Layout.
                */}
                <Route 
                    path="/" 
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    {/* Chuyển hướng path gốc "/" vào thẳng "/dashboard" */}
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    
                    {/* Các trang chức năng của hệ thống */}
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="categories" element={<Categories />} />
                    <Route path="products" element={<Products />} />
                    <Route path="warehouses" element={<Warehouses />} />
                    <Route path="stocks" element={<Stocks />} />
                    <Route path="transactions" element={<Transactions />} />
                    <Route path="users" element={<Users />} />
                </Route>

                {/* Catch-all: Nếu nhập linh tinh đường dẫn không tồn tại thì cho về trang chủ */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};
export default App;