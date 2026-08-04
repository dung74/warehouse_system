import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Layout from "./pages/Layout";
import Login from "./pages/Login";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import Warehouses from "./pages/Warehouses";
import MyWarehouse from "./pages/MyWarehouse";
import Stocks from "./pages/Stocks";
import Transactions from "./pages/Transactions";
import MyTransactions from "./pages/MyTransactions";
import Users from "./pages/Users";

const Dashboard = () => (
    <div className="space-y-6 animate-fade-in">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
            <p className="mt-1 text-sm text-slate-500">Warehouse operations at a glance.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-800">System status</h3>
                <div className="flex items-center text-green-600 font-bold text-lg mt-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></span>
                    Operational
                </div>
            </div>

            <div className="flex flex-col justify-center rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="font-semibold text-slate-700">Warehouse Management</p>
                <p className="mt-1 text-sm text-slate-400">Products, inventory, and warehouse workflows in one place.</p>
            </div>

            <div className="flex flex-col justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
                <p className="font-medium text-slate-600">Additional insights coming soon</p>
                <p className="mt-1 text-sm text-slate-400">This area is reserved for future reporting tools.</p>
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

const AdminRoute = ({ children }) => {
    const userRole = localStorage.getItem('user_role');
    if (userRole !== '1') return <Navigate to="/dashboard" replace />;
    return children;
};

function App() {
    const userRole = localStorage.getItem('user_role');
    const warehouseId = localStorage.getItem('warehouse_id');

    const isAdmin = userRole === '1';

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route 
                    path="/" 
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="warehouses" element={
                        <AdminRoute>
                            <Warehouses />
                        </AdminRoute>
                    } />
                    
                    <Route path="my-warehouse" element={<MyWarehouse />} />
                    
                    <Route path="transactions" element={
                        <AdminRoute>
                            <Transactions />
                        </AdminRoute>
                    } />
                    <Route path="my-transactions" element={<MyTransactions />} />

                    <Route path="categories" element={<Categories />} />
                    <Route path="products" element={<Products />} />
                    <Route path="stocks" element={<Stocks />} />
                   
                    
                    <Route path="users" element={<Users />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;