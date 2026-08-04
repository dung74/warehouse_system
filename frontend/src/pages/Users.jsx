import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { warehouseService } from '../services/warehouseService';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        email: '',
        role_id: '2',
        warehouse_id: ''
    });

    // --- STATE MỚI CHO MODAL CHI TIẾT ---
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);
    
    const fetchData = async () => {
        try {
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
            setFormData({
                ...formData, 
                username: '', 
                password: '',
                full_name: '',
                email: ''
            });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.detail || "Error when creating user");
        }
    };

    // --- HÀM XỬ LÝ KHI BẤM NÚT XEM CHI TIẾT ---
    const handleViewDetail = async (userId) => {
        setIsLoadingDetail(true);
        try {
            // Gọi API get_detail bạn vừa tạo
            const data = await userService.getUserDetail(userId);
            setSelectedUser(data);
            setIsDetailOpen(true);
        } catch (error) {
            alert(error.response?.data?.detail || "Không thể lấy thông tin chi tiết!");
        } finally {
            setIsLoadingDetail(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            <h2 className="text-2xl font-bold text-gray-800">Quản lý Tài khoản</h2>

            {/* Form Tạo Tài khoản (Giữ nguyên) */}
            <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
                <h3 className="mb-4 text-lg font-semibold text-gray-700">Tạo tài khoản mới</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ... (Các thẻ input giữ nguyên như cũ) ... */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Họ và tên</label>
                            <input type="text" required className="w-full px-4 py-2 transition-all border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
                            <input type="email" required className="w-full px-4 py-2 transition-all border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Username</label>
                            <input type="text" required className="w-full px-4 py-2 transition-all border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Mật khẩu</label>
                            <input type="password" required className="w-full px-4 py-2 transition-all border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Chức vụ (Role)</label>
                            <select className="w-full px-4 py-2 transition-all border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={formData.role_id} onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}>
                                <option value={1}>Admin (Quản trị viên)</option>
                                <option value={2}>Staff (Nhân viên Kho)</option>
                            </select>
                        </div>
                        {Number(formData.role_id) === 2 && (
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Trực thuộc Kho</label>
                                <select className="w-full px-4 py-2 transition-all border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={formData.warehouse_id} onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}>
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="px-6 py-2 font-medium text-white transition-all bg-blue-600 rounded-lg hover:bg-blue-700">
                            + Tạo Tài khoản
                        </button>
                    </div>
                </form>
            </div>

            {/* Bảng Danh sách Tài khoản */}
            <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">ID</th>
                                <th className="px-6 py-4 font-semibold">Họ và tên</th>
                                <th className="px-6 py-4 font-semibold">Username</th>
                                <th className="px-6 py-4 font-semibold">Quyền hạn</th>
                                <th className="px-6 py-4 font-semibold text-center">Hành động</th> {/* CỘT MỚI */}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(u => (
                                <tr key={u.id} className="transition-colors hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">#{u.id}</td>
                                    <td className="px-6 py-4 text-gray-900">{u.full_name || '-'}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{u.username}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                            u.role_id === 1 ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {u.role_id === 1 ? 'Admin' : 'Staff'}
                                        </span>
                                    </td>
                                    {/* NÚT BẤM XEM CHI TIẾT */}
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => handleViewDetail(u.id)}
                                            disabled={isLoadingDetail}
                                            className="px-3 py-1 text-sm font-medium text-blue-600 transition-colors bg-blue-50 hover:bg-blue-100 rounded-md"
                                        >
                                            👁️ Xem
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL HIỂN THỊ CHI TIẾT --- */}
            {isDetailOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md relative animate-fade-in-up">
                        {/* Nút đóng (X) */}
                        <button 
                            onClick={() => setIsDetailOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Chi Tiết Nhân Viên</h3>
                        
                        <div className="space-y-4 text-sm text-gray-700">
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="font-semibold">ID:</span>
                                <span>#{selectedUser.id}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="font-semibold">Họ và tên:</span>
                                <span>{selectedUser.full_name || 'Đang cập nhật'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="font-semibold">Username:</span>
                                <span>{selectedUser.username}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="font-semibold">Email:</span>
                                <span>{selectedUser.email || 'Đang cập nhật'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="font-semibold">Vai trò:</span>
                                <span className={selectedUser.role_id === 1 ? 'text-purple-600 font-medium' : 'text-blue-600 font-medium'}>
                                    {selectedUser.role_id === 1 ? 'Admin (Quản trị)' : 'Staff (Nhân viên)'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="font-semibold">Kho trực thuộc:</span>
                                <span>
                                    {selectedUser.role_id === 1 
                                        ? 'Toàn bộ hệ thống' 
                                        : (warehouses.find(w => w.id === selectedUser.warehouse_id)?.name || `Kho #${selectedUser.warehouse_id}`)}
                                </span>
                            </div>
                            <div className="flex justify-between pb-2">
                                <span className="font-semibold">Trạng thái:</span>
                                <span className={selectedUser.is_active ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                    {selectedUser.is_active ? '● Đang hoạt động' : '● Bị khóa'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button 
                                onClick={() => setIsDetailOpen(false)}
                                className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;