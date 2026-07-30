import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { warehouseService } from '../services/warehouseService';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role_id: '2',
        warehouse_id: ''
    });

    useEffect(() => {
        fetchData();
    }, []);
    
    const fetchData = async () => {
        try{
            const [userData, warehouseData] = await Promise.all([
                userService.getAll(),
                warehouseService.getAll()
            ]);
            setUsers(userData);
            setWarehouses(warehouseData);

            if (warehouseData.length > 0) {
                setFormData(prev => ({ ...prev, warehouse_id: warehouseData[0].id }));
            }
        } catch (error) {
            console.error("Error fetching users or warehouses:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData, 
                role_id: Number(formData.role_id),
                warehouse_id: Number(formData.role_id) === 1 ? null : Number(formData.warehouse_id)
            };
            await userService.create(payload);
            alert("User created successfully!");
            setFormData({...FormData, username: '', password: ''});
            fetchData();

        } catch (error) {
            alert(error.response?.data?.detail || "Error when creating user");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800">Quản lý Tài khoản</h2>

            {/* Khối 1: Form Tạo Tài khoản */}
            <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
                <h3 className="mb-4 text-lg font-semibold text-gray-700">Tạo tài khoản mới</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Username */}
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Username</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 transition-all border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                                placeholder="Nhập tên đăng nhập"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Mật khẩu khởi tạo</label>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-2 transition-all border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                                placeholder="Nhập mật khẩu"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Chức vụ (Role)</label>
                            <select
                                className="w-full px-4 py-2 transition-all border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                                value={formData.role_id}
                                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                            >
                                <option value={1}>Admin (Quản trị viên)</option>
                                <option value={2}>Staff (Nhân viên Kho)</option>
                            </select>
                        </div>

                        {/* Trực thuộc Kho (Chỉ hiện khi là Staff) */}
                        {Number(formData.role_id) === 2 && (
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Trực thuộc Kho</label>
                                <select
                                    className="w-full px-4 py-2 transition-all border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                                    value={formData.warehouse_id}
                                    onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                                >
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            className="px-6 py-2 font-medium text-white transition-all bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200"
                        >
                            + Tạo Tài khoản
                        </button>
                    </div>
                </form>
            </div>

            {/* Khối 2: Bảng Danh sách Tài khoản */}
            <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">ID</th>
                                <th className="px-6 py-4 font-semibold">Username</th>
                                <th className="px-6 py-4 font-semibold">Quyền hạn</th>
                                <th className="px-6 py-4 font-semibold">Kho trực thuộc</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(u => (
                                <tr key={u.id} className="transition-colors hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        #{u.id}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {u.username}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                            u.role_id === 1 
                                                ? 'bg-purple-100 text-purple-700' 
                                                : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {u.role_id === 1 ? 'Admin' : 'Staff'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {u.warehouse_id ? (
                                            <span className="text-gray-700">
                                                {warehouses.find(w => w.id === u.warehouse_id)?.name || `Kho #${u.warehouse_id}`}
                                            </span>
                                        ) : (
                                            <span className="italic text-gray-400">
                                                Toàn quyền (Tất cả kho)
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                        Chưa có tài khoản nào trong hệ thống.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default Users;