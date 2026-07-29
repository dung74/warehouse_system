import React from 'react';
import {NavLink, Outlet} from 'react-router-dom';

const Layout = () => {
    const menuItems = [
        { path: '/dashboard', label: 'Tổng quan (Dashboard)', icon: '📊' },
        { path: '/transactions', label: 'Nhập / Xuất kho', icon: '🔄' },
        { path: '/stocks', label: 'Tồn kho', icon: '📦' },
        { path: '/products', label: 'Sản phẩm', icon: '🏷️' },
        { path: '/categories', label: 'Danh mục', icon: '📁' },
        { path: '/warehouses', label: 'Quản lý Kho', icon: '🏢' },
    ];

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            {/* 1. SIDEBAR TRÁI */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20 transition-all duration-300">
                
                {/* Logo / Tên hệ thống */}
                <div className="h-16 flex items-center justify-center border-b border-slate-800">
                    <h1 className="text-2xl font-bold tracking-wider text-blue-400">
                        WMS <span className="text-white">SYSTEM</span>
                    </h1>
                </div>

                {/* Danh sách Menu */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                                    isActive 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`
                            }
                        >
                            <span className="mr-3 text-lg group-hover:scale-110 transition-transform">
                                {item.icon}
                            </span>
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer Sidebar - Thông tin Admin */}
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center px-4 py-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
                        <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center mr-3 font-bold shadow-inner">
                            A
                        </div>
                        <div className="text-sm">
                            <p className="font-semibold text-white">Admin</p>
                            <p className="text-slate-400 text-xs">Quản trị viên</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* 2. MAIN CONTENT (Nội dung chính bên phải) */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                
                {/* Header phía trên */}
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8 z-10 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-700">Hệ thống Quản lý Kho</h2>
                    
                    {/* Thêm vài icon bên góc phải cho chuyên nghiệp */}
                    <div className="flex items-center space-x-4">
                        <button className="text-gray-400 hover:text-blue-600 transition-colors text-xl">
                            🔔
                        </button>
                        <button className="text-gray-400 hover:text-blue-600 transition-colors text-xl">
                            ⚙️
                        </button>
                    </div>
                </header>

                {/* Khu vực Outlet render các trang */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
                    {/* Bọc Outlet trong một thẻ card màu trắng để nội dung các trang con nổi bật lên */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-full p-6">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;