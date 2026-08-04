import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import ChangePasswordModal from './ChangePasswordModal';

const Layout = () => {
    const navigate = useNavigate();
    
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    const userRole = parseInt(localStorage.getItem('user_role') || '2', 10); 
    const isAdmin = userRole === 1;
    const fullName = localStorage.getItem('full_name') || 'User';
    const username = localStorage.getItem('username') || 'Unknown';

    // --- XÂY DỰNG MENU ĐỘNG THEO ROLE ---
    const menuItems = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/stocks', label: 'Inventory' },
        { path: '/products', label: 'Products' },
        { path: '/categories', label: 'Categories' },
    ];
    
    // Nếu là Admin thì thêm Quản lý kho (danh sách) và Quản lý Users
    if (isAdmin) {
        menuItems.push({ path: '/warehouses', label: 'Warehouses' });
        menuItems.push({ path: '/transactions', label: 'Transactions' });
        menuItems.push({ path: '/users', label: 'Users' });
    } else {
        // Nếu là Manager/User thì trỏ vào đường dẫn Kho của tôi
        menuItems.push({ path: '/my-warehouse', label: 'My Warehouse' });
        menuItems.push({ path: '/my-transactions', label: 'My Transactions' });
    }

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen font-sans bg-gray-50">
            <aside className="z-20 flex flex-col w-64 text-white transition-all duration-300 shadow-2xl bg-slate-900">
                <div className="flex items-center justify-center h-16 border-b border-slate-800">
                    <h1 className="text-2xl font-bold tracking-wider text-blue-400">
                        WMS <span className="text-white">SYSTEM</span>
                    </h1>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex px-4 py-3 rounded-lg transition-all duration-200 ${
                                    isActive 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`
                            }
                        >
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    {/* Hiển thị thông tin thật của User */}
                    <div className="flex items-center px-4 py-3 mb-3 transition-colors rounded-lg bg-slate-800">
                        <div className="text-sm overflow-hidden">
                            <p className="font-semibold text-white truncate" title={fullName}>
                                {fullName}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                                @{username} • {isAdmin ? 'Administrator' : 'Warehouse staff'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <button 
                            onClick={() => setIsChangePasswordOpen(true)}
                            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-blue-400 transition-colors border rounded-lg border-blue-900/50 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                        >
                            Change password
                        </button>

                        <button 
                            onClick={handleLogout}
                            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-red-400 transition-colors border rounded-lg border-red-900/50 hover:bg-red-600 hover:text-white hover:border-red-600"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </aside>

            <main className="relative flex flex-col flex-1 overflow-hidden">
                <header className="z-10 flex items-center justify-between h-16 px-8 bg-white border-b border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-700">Warehouse Management System</h2>
                    <span className="text-sm text-gray-500">Operations workspace</span>
                </header>

                <div className="flex-1 p-6 overflow-y-auto bg-slate-50 md:p-8">
                    <div className="p-6 bg-white border border-gray-100 shadow-sm min-h-full rounded-xl">
                        <Outlet />
                    </div>
                </div>
            </main>

            <ChangePasswordModal 
                isOpen={isChangePasswordOpen} 
                onClose={() => setIsChangePasswordOpen(false)} 
            />
        </div>
    );
};

export default Layout;