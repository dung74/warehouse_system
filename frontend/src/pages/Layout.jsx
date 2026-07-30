import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Layout = () => {
    const navigate = useNavigate();

    // 1. ĐÃ CHUYỂN VÀO TRONG COMPONENT: Sẽ được cập nhật mỗi khi component render lại
    const userRole = parseInt(localStorage.getItem('user_role') || '2', 10);
    const isAdmin = userRole === 1;

    const menuItems = [
        { path: '/dashboard', label: 'Tổng quan (Dashboard)', icon: '📊' },
        { path: '/transactions', label: 'Nhập / Xuất kho', icon: '🔄' },
        { path: '/stocks', label: 'Tồn kho', icon: '📦' },
        { path: '/products', label: 'Sản phẩm', icon: '🏷️' },
        { path: '/categories', label: 'Danh mục', icon: '📁' },
        { path: '/warehouses', label: 'Quản lý Kho', icon: '🏢' },
    ];
    
    // Nếu là Admin thì thêm menu Quản lý tài khoản
    if (isAdmin) {
        menuItems.push({ path: '/users', label: 'Quản lý Tài khoản', icon: '👤' });
    }

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen font-sans bg-gray-50">
            {/* 1. SIDEBAR TRÁI */}
            <aside className="z-20 flex flex-col w-64 text-white transition-all duration-300 shadow-2xl bg-slate-900">
                
                {/* Logo / Tên hệ thống */}
                <div className="flex items-center justify-center h-16 border-b border-slate-800">
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
                            <span className="mr-3 text-lg transition-transform group-hover:scale-110">
                                {item.icon}
                            </span>
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer Sidebar - Thông tin User */}
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center px-4 py-3 mb-3 transition-colors cursor-pointer rounded-lg bg-slate-800 hover:bg-slate-700">
                        {/* 2. HIỂN THỊ ĐỘNG ICON VÀ TÊN DỰA VÀO ROLE */}
                        <div className={`flex items-center justify-center mr-3 font-bold rounded-full shadow-inner w-9 h-9 ${isAdmin ? 'bg-blue-500' : 'bg-green-500'}`}>
                            {isAdmin ? 'A' : 'S'}
                        </div>
                        <div className="text-sm">
                            <p className="font-semibold text-white">
                                {isAdmin ? 'Admin' : 'Staff'}
                            </p>
                            <p className="text-xs text-slate-400">
                                {isAdmin ? 'Quản trị viên' : 'Nhân viên Kho'}
                            </p>
                        </div>
                    </div>

                    {/* Nút Đăng xuất */}
                    <button 
                        onClick={handleLogout}
                        className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-red-400 transition-colors border rounded-lg border-red-900/50 hover:bg-red-600 hover:text-white hover:border-red-600"
                    >
                        <span className="mr-2 text-base">🚪</span> Đăng xuất
                    </button>
                </div>
            </aside>

            {/* 2. MAIN CONTENT (Nội dung chính bên phải) */}
            <main className="relative flex flex-col flex-1 overflow-hidden">
                
                {/* Header phía trên */}
                <header className="z-10 flex items-center justify-between h-16 px-8 bg-white border-b border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-700">Hệ thống Quản lý Kho</h2>
                    
                    {/* Thêm vài icon bên góc phải cho chuyên nghiệp */}
                    <div className="flex items-center space-x-4">
                        <button className="text-xl text-gray-400 transition-colors hover:text-blue-600">
                            🔔
                        </button>
                        <button className="text-xl text-gray-400 transition-colors hover:text-blue-600">
                            ⚙️
                        </button>
                    </div>
                </header>

                {/* Khu vực Outlet render các trang */}
                <div className="flex-1 p-6 overflow-y-auto bg-slate-50 md:p-8">
                    {/* Bọc Outlet trong một thẻ card màu trắng để nội dung các trang con nổi bật lên */}
                    <div className="p-6 bg-white border border-gray-100 shadow-sm min-h-full rounded-xl">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;