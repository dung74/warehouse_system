import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { userService } from '../services/userService';
import { warehouseService } from '../services/warehouseService';

const Users = () => {
    // --- LẤY TRẠNG THÁI TỪ URL ---
    const [searchParams, setSearchParams] = useSearchParams();
    
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const urlUsername = searchParams.get('username') || '';
    const urlRoleId = searchParams.get('role_id') || '';
    const urlWarehouseId = searchParams.get('warehouse_id') || '';
    const limit = 10;

    const [users, setUsers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);

    // Trạng thái local cho form lọc
    const [filters, setFilters] = useState({
        username: urlUsername,
        role_id: urlRoleId,
        warehouse_id: urlWarehouseId
    });

    // --- STATES CHO TẠO MỚI ---
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        email: '',
        role_id: '2',
        warehouse_id: ''
    });

    // --- STATES CHO MODAL CHI TIẾT ---
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    // --- STATES CHO MODAL SỬA (Đã sửa theo schema API) ---
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        id: '',
        username: '',
        full_name: '',
        email: '',
        role_id: '2',
        warehouse_id: ''
    });

    useEffect(() => {
        const fetchWarehouses = async () => {
            try {
                const warehouseData = await warehouseService.getAll();
                setWarehouses(warehouseData);
                if (warehouseData.length > 0) {
                    setFormData(prev => ({ ...prev, warehouse_id: warehouseData[0].id }));
                }
            } catch (error) {
                console.error("Error fetching warehouses:", error);
            }
        };
        fetchWarehouses();
    }, []);

    useEffect(() => {
        fetchUsers();
        setFilters({
            username: searchParams.get('username') || '',
            role_id: searchParams.get('role_id') || '',
            warehouse_id: searchParams.get('warehouse_id') || ''
        });
    }, [searchParams]);

    const fetchUsers = async () => {
        try {
            const params = {
                skip: (currentPage - 1) * limit,
                limit: limit
            };
            
            if (searchParams.get('username')) params.username = searchParams.get('username');
            if (searchParams.get('role_id')) params.role_id = Number(searchParams.get('role_id'));
            if (searchParams.get('warehouse_id')) params.warehouse_id = Number(searchParams.get('warehouse_id'));

            const userData = await userService.getAll(params);
            setUsers(userData);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    // --- HÀNH ĐỘNG TÌM KIẾM VÀ RESET ---
    const handleSearch = (e) => {
        e.preventDefault();
        const newParams = new URLSearchParams();
        
        newParams.set('page', '1');
        if (filters.username) newParams.set('username', filters.username);
        if (filters.role_id) newParams.set('role_id', filters.role_id);
        if (filters.warehouse_id) newParams.set('warehouse_id', filters.warehouse_id);
        
        setSearchParams(newParams);
    };

    const handleResetFilters = () => {
        setFilters({ username: '', role_id: '', warehouse_id: '' });
        // Xóa sạch params lọc trên URL, chỉ giữ lại page=1
        setSearchParams(new URLSearchParams({ page: '1' }));
    };

    const changePage = (newPage) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', newPage.toString());
        setSearchParams(newParams);
    };

    // --- CÁC HÀNH ĐỘNG CRUD ---
    const handleSubmitCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData, 
                role_id: Number(formData.role_id),
                warehouse_id: Number(formData.role_id) === 1 ? null : Number(formData.warehouse_id)
            };
            await userService.create(payload);
            alert("Account created successfully.");
            setFormData({ ...formData, username: '', password: '', full_name: '', email: '' });
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.detail || "Unable to create account.");
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (window.confirm(`Are you sure you want to deactivate account '${username}'?`)) {
            try {
                const res = await userService.deleteUser(userId);
                alert(res.detail || "Account deactivated successfully.");
                fetchUsers();
            } catch (error) {
                alert(error.response?.data?.detail || "Unable to deactivate account.");
            }
        }
    };

    const handleViewDetail = async (userId) => {
        setIsLoadingDetail(true);
        try {
            const data = await userService.getUserDetail(userId);
            setSelectedUser(data);
            setIsDetailOpen(true);
        } catch (error) {
            alert(error.response?.data?.detail || "Unable to load user details.");
        } finally {
            setIsLoadingDetail(false);
        }
    };

    // --- HÀNH ĐỘNG SỬA ---
    const handleOpenEdit = (user) => {
        setEditFormData({
            id: user.id,
            username: user.username,
            full_name: user.full_name || '',
            email: user.email || '',
            role_id: String(user.role_id),
            warehouse_id: user.warehouse_id ? String(user.warehouse_id) : (warehouses.length > 0 ? String(warehouses[0].id) : ''),
        });
        setIsEditOpen(true);
    };

    const handleSubmitEdit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                username: editFormData.username,
                full_name: editFormData.full_name,
                email: editFormData.email,
                role_id: Number(editFormData.role_id),
                warehouse_id: Number(editFormData.role_id) === 1 ? null : Number(editFormData.warehouse_id)
            };
            await userService.updateUser(editFormData.id, payload);
            alert("Account updated successfully.");
            setIsEditOpen(false);
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.detail || "Unable to update account.");
        }
    };

    return (
        <div className="space-y-6 relative animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800">Users</h2>

            {/* --- FORM TẠO TÀI KHOẢN --- */}
            <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
                <h3 className="mb-4 text-lg font-semibold text-gray-700">Create user</h3>
                <form onSubmit={handleSubmitCreate} className="space-y-4">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Username *</label>
                            <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Password *</label>
                            <input type="password" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Full name</label>
                            <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
                            <input type="email" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Role</label>
                            <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.role_id} onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}>
                                <option value={1}>Admin</option>
                                <option value={2}>Staff</option>
                            </select>
                        </div>
                        {Number(formData.role_id) === 2 && (
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Assigned warehouse</label>
                                <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.warehouse_id} onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}>
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="px-6 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                            Create user
                        </button>
                    </div>
                </form>
            </div>

            {/* --- BỘ LỌC TÌM KIẾM --- */}
            <div className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block mb-1 text-sm font-medium text-gray-700">Username</label>
                        <input type="text" placeholder="Search by username" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={filters.username} onChange={(e) => setFilters({ ...filters, username: e.target.value })} />
                    </div>
                    <div className="w-full md:w-48">
                        <label className="block mb-1 text-sm font-medium text-gray-700">Role</label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={filters.role_id} onChange={(e) => setFilters({ ...filters, role_id: e.target.value })}>
                            <option value="">All roles</option>
                            <option value="1">Admin</option>
                            <option value="2">Staff</option>
                        </select>
                    </div>
                    <div className="w-full md:w-48">
                        <label className="block mb-1 text-sm font-medium text-gray-700">Warehouse</label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={filters.warehouse_id} onChange={(e) => setFilters({ ...filters, warehouse_id: e.target.value })}>
                            <option value="">All warehouses</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button type="button" onClick={handleResetFilters} className="px-4 py-2 font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            Reset
                        </button>
                        <button type="submit" className="px-6 py-2 font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition-colors">
                            Apply filters
                        </button>
                    </div>
                </form>
            </div>

            {/* --- BẢNG DANH SÁCH --- */}
            <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">ID</th>
                                <th className="px-6 py-4 font-semibold">Username</th>
                                <th className="px-6 py-4 font-semibold">Role</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(u => (
                                <tr key={u.id} className={`transition-colors hover:bg-slate-50 ${!u.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
                                    <td className="px-6 py-4 font-medium text-gray-900">#{u.id}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{u.username}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${ u.role_id === 1 ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700' }`}>
                                            {u.role_id === 1 ? 'Admin' : 'Staff'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${ u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700' }`}>
                                            {u.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex justify-center gap-2">
                                        <button onClick={() => handleViewDetail(u.id)} className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md">
                                            View
                                        </button>
                                        <button onClick={() => handleOpenEdit(u)} className="px-3 py-1 text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-md">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDeleteUser(u.id, u.username)} disabled={!u.is_active} className={`px-3 py-1 text-sm font-medium rounded-md ${ u.is_active ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-gray-400 bg-gray-100 cursor-not-allowed' }`}>
                                            Deactivate
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <button 
                        onClick={() => changePage(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm font-medium text-gray-600">Page {currentPage}</span>
                    <button 
                        onClick={() => changePage(currentPage + 1)} 
                        disabled={users.length < limit}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* --- MODAL CHI TIẾT --- */}
            {isDetailOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md relative">
                        <button onClick={() => setIsDetailOpen(false)} className="absolute top-4 right-4 text-sm text-gray-500 hover:text-gray-700">Close</button>
                        <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">User details #{selectedUser.id}</h3>
                        <div className="space-y-4 text-sm text-gray-700">
                            <p><span className="font-semibold">Full name:</span> {selectedUser.full_name || 'N/A'}</p>
                            <p><span className="font-semibold">Username:</span> {selectedUser.username}</p>
                            <p><span className="font-semibold">Email:</span> {selectedUser.email || 'N/A'}</p>
                            <p><span className="font-semibold">Role:</span> {selectedUser.role_id === 1 ? 'Admin' : 'Staff'}</p>
                            <p><span className="font-semibold">Status:</span> {selectedUser.is_active ? 'Active' : 'Inactive'}</p>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setIsDetailOpen(false)} className="px-5 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL CẬP NHẬT --- */}
            {isEditOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg relative animate-fade-in-up">
                        <button onClick={() => setIsEditOpen(false)} className="absolute top-4 right-4 text-sm text-gray-500 hover:text-gray-700">Close</button>
                        <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Update account #{editFormData.id}</h3>
                        
                        <form onSubmit={handleSubmitEdit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Username</label>
                                    <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={editFormData.username} onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Full name</label>
                                    <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={editFormData.full_name} onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
                                    <input type="email" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Role</label>
                                    <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={editFormData.role_id} onChange={(e) => setEditFormData({ ...editFormData, role_id: e.target.value })}>
                                        <option value={1}>Admin</option>
                                        <option value={2}>Staff</option>
                                    </select>
                                </div>
                                {Number(editFormData.role_id) === 2 && (
                                    <div className="md:col-span-2">
                                        <label className="block mb-1 text-sm font-medium text-gray-700">Assigned warehouse</label>
                                        <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={editFormData.warehouse_id} onChange={(e) => setEditFormData({ ...editFormData, warehouse_id: e.target.value })}>
                                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsEditOpen(false)} className="px-5 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">Save changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
