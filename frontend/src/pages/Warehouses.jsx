import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { warehouseService } from '../services/warehouseService';

const Warehouse = () => {
    // --- LẤY TRẠNG THÁI TỪ URL ---
    const [searchParams, setSearchParams] = useSearchParams();
    
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const urlName = searchParams.get('name') || '';
    const urlParentId = searchParams.get('parent_id') || '';
    const limit = 10;

    // --- STATES DỮ LIỆU ---
    const [warehouses, setWarehouses] = useState([]);
    const [centralWarehouses, setCentralWarehouses] = useState([]); 

    const [filters, setFilters] = useState({
        name: urlName,
        parent_id: urlParentId
    });

    const [formData, setFormData] = useState({ 
        name: '', 
        warehouse_type: 'BRANCH', 
        parent_id: '' 
    });

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        id: '',
        name: '',
        warehouse_type: 'BRANCH',
        parent_id: '',
        is_active: true
    });

    // --- STATES CHO MODAL CHI TIẾT ---
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    useEffect(() => {
        const fetchAllForDropdown = async () => {
            try {
                const data = await warehouseService.getAll({ limit: 1000 });
                const centrals = data.filter(w => w.warehouse_type === 'CENTRAL');
                setCentralWarehouses(centrals);
            } catch (error) {
                console.error("Error fetching central warehouses:", error);
            }
        };
        fetchAllForDropdown();
    }, []);

    useEffect(() => {
        fetchWarehouses();
        setFilters({
            name: searchParams.get('name') || '',
            parent_id: searchParams.get('parent_id') || ''
        });
    }, [searchParams]);

    const fetchWarehouses = async () => {
        try {
            const params = { skip: (currentPage - 1) * limit, limit: limit };
            if (searchParams.get('name')) params.name = searchParams.get('name');
            if (searchParams.get('parent_id')) params.parent_id = Number(searchParams.get('parent_id'));

            const data = await warehouseService.getAll(params);
            setWarehouses(data);
        } catch (error) {
            console.error("Error fetching warehouses:", error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const newParams = new URLSearchParams();
        newParams.set('page', '1');
        if (filters.name) newParams.set('name', filters.name);
        if (filters.parent_id) newParams.set('parent_id', filters.parent_id);
        setSearchParams(newParams);
    };

    const handleResetFilters = () => {
        setFilters({ name: '', parent_id: '' });
        setSearchParams(new URLSearchParams({ page: '1' }));
    };

    const changePage = (newPage) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', newPage.toString());
        setSearchParams(newParams);
    };

    const handleSubmitCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                parent_id: formData.warehouse_type === 'BRANCH' ? Number(formData.parent_id) : null
            };
            await warehouseService.create(payload);
            alert("Tạo kho thành công!");
            setFormData({ name: '', warehouse_type: 'BRANCH', parent_id: '' });
            fetchWarehouses();
            
            if(payload.warehouse_type === 'CENTRAL') {
                const data = await warehouseService.getAll({ limit: 1000 });
                setCentralWarehouses(data.filter(w => w.warehouse_type === 'CENTRAL'));
            }
        } catch (error) {
            alert(error.response?.data?.detail || "Lỗi khi tạo kho");
        }
    };

    const handleOpenEdit = (warehouse) => {
        setEditFormData({
            id: warehouse.id,
            name: warehouse.name,
            warehouse_type: warehouse.warehouse_type,
            parent_id: warehouse.parent_id ? String(warehouse.parent_id) : '',
            is_active: warehouse.is_active
        });
        setIsEditOpen(true);
    };

    const handleSubmitEdit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: editFormData.name,
                warehouse_type: editFormData.warehouse_type,
                parent_id: editFormData.warehouse_type === 'BRANCH' ? Number(editFormData.parent_id) : null,
                is_active: editFormData.is_active
            };
            await warehouseService.update(editFormData.id, payload);
            alert("Cập nhật kho thành công!");
            setIsEditOpen(false);
            fetchWarehouses();
        } catch (error) {
            alert(error.response?.data?.detail || "Lỗi khi cập nhật kho");
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Bạn có chắc chắn muốn vô hiệu hóa kho '${name}'?`)) {
            try {
                const res = await warehouseService.delete(id);
                alert(res.detail || "Đã vô hiệu hóa kho!");
                fetchWarehouses();
            } catch (error) {
                alert(error.response?.data?.detail || "Không thể vô hiệu hóa kho!");
            }
        }
    };

    const handleViewDetail = async (id) => {
        setIsLoadingDetail(true);
        try {
            const data = await warehouseService.getDetail(id);
            setSelectedDetail(data);
            setIsDetailOpen(true);
        } catch (error) {
            alert(error.response?.data?.detail || "Không thể lấy thông tin chi tiết!");
        } finally {
            setIsLoadingDetail(false);
        }
    };

    return (
        <div className="space-y-6 relative animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800">Quản lý Kho bãi</h2>

            {/* --- FORM THÊM MỚI --- */}
            <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
                <h3 className="mb-4 text-lg font-semibold text-gray-700">Tạo Kho mới</h3>
                <form onSubmit={handleSubmitCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label className="block mb-1 text-sm font-medium text-gray-700">Tên Kho *</label>
                        <input type="text" required placeholder="VD: Kho Hà Nội..." className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block mb-1 text-sm font-medium text-gray-700">Loại Kho</label>
                        <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.warehouse_type} onChange={(e) => setFormData({ ...formData, warehouse_type: e.target.value, parent_id: '' })}>
                            <option value="CENTRAL">Kho Tổng (CENTRAL)</option>
                            <option value="BRANCH">Kho Nhánh (BRANCH)</option>
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        {formData.warehouse_type === 'BRANCH' && (
                            <>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Thuộc Kho Tổng *</label>
                                <select required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.parent_id} onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}>
                                    <option value="">-- Chọn --</option>
                                    {centralWarehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </>
                        )}
                    </div>
                    <div className="md:col-span-1 flex justify-end">
                        <button type="submit" className="w-full px-6 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                            + Thêm Kho
                        </button>
                    </div>
                </form>
            </div>

            {/* --- BỘ LỌC TÌM KIẾM --- */}
            <div className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block mb-1 text-sm font-medium text-gray-700">Tìm tên kho</label>
                        <input type="text" placeholder="Nhập tên..." className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} />
                    </div>
                    <div className="w-full md:w-64">
                        <label className="block mb-1 text-sm font-medium text-gray-700">Lọc theo Kho Tổng</label>
                        <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={filters.parent_id} onChange={(e) => setFilters({ ...filters, parent_id: e.target.value })}>
                            <option value="">Tất cả</option>
                            {centralWarehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button type="button" onClick={handleResetFilters} className="px-4 py-2 font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                            Làm mới
                        </button>
                        <button type="submit" className="px-6 py-2 font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-900">
                            🔍 Lọc
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
                                <th className="px-6 py-4 font-semibold">Tên Kho</th>
                                <th className="px-6 py-4 font-semibold">Phân Loại</th>
                                <th className="px-6 py-4 font-semibold">Kho Tổng (Cha)</th>
                                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                                <th className="px-6 py-4 font-semibold text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {warehouses.map(w => (
                                <tr key={w.id} className={`transition-colors hover:bg-slate-50 ${!w.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
                                    <td className="px-6 py-4 font-medium text-gray-900">#{w.id}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{w.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${w.warehouse_type === 'CENTRAL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {w.warehouse_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {w.warehouse_type === 'BRANCH' 
                                            ? centralWarehouses.find(parent => parent.id === w.parent_id)?.name || `ID #${w.parent_id}`
                                            : '-'
                                        }
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${w.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {w.is_active ? 'Hoạt động' : 'Đã khóa'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex justify-center gap-2">
                                        <button onClick={() => handleViewDetail(w.id)} disabled={isLoadingDetail} className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md">
                                            👁️ Xem
                                        </button>
                                        <button onClick={() => handleOpenEdit(w)} className="px-3 py-1 text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-md">
                                            ✏️ Sửa
                                        </button>
                                        <button onClick={() => handleDelete(w.id, w.name)} disabled={!w.is_active} className={`px-3 py-1 text-sm font-medium rounded-md ${w.is_active ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-gray-400 bg-gray-100 cursor-not-allowed'}`}>
                                            🗑️ Khóa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <button onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-100 disabled:opacity-50">
                        ← Trang trước
                    </button>
                    <span className="text-sm font-medium text-gray-600">Trang {currentPage}</span>
                    <button onClick={() => changePage(currentPage + 1)} disabled={warehouses.length < limit} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-100 disabled:opacity-50">
                        Trang sau →
                    </button>
                </div>
            </div>

            {/* --- MODAL CẬP NHẬT (Giữ nguyên) --- */}
            {isEditOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    {/* ... (Phần nội dung Modal Sửa giữ nguyên như cũ) ... */}
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg relative animate-fade-in-up">
                        <button onClick={() => setIsEditOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">✕</button>
                        <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Cập nhật Kho #{editFormData.id}</h3>
                        
                        <form onSubmit={handleSubmitEdit} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Tên Kho</label>
                                    <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Loại Kho</label>
                                    <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={editFormData.warehouse_type} onChange={(e) => setEditFormData({ ...editFormData, warehouse_type: e.target.value, parent_id: '' })}>
                                        <option value="CENTRAL">Kho Tổng</option>
                                        <option value="BRANCH">Kho Nhánh</option>
                                    </select>
                                </div>
                                {editFormData.warehouse_type === 'BRANCH' && (
                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-gray-700">Thuộc Kho Tổng</label>
                                        <select required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={editFormData.parent_id} onChange={(e) => setEditFormData({ ...editFormData, parent_id: e.target.value })}>
                                            <option value="">-- Chọn --</option>
                                            {centralWarehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="flex items-center space-x-2">
                                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={editFormData.is_active} onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })} />
                                        <span className="text-sm font-medium text-gray-700">Đang hoạt động</span>
                                    </label>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsEditOpen(false)} className="px-5 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Hủy</button>
                                <button type="submit" className="px-5 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">Lưu thay đổi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- NÂNG CẤP: MODAL CHI TIẾT KHO MỞ RỘNG --- */}
            {isDetailOpen && selectedDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    {/* Tăng max-w-2xl lên max-w-4xl để màn hình to và rộng hơn */}
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-4xl relative max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
                        <button onClick={() => setIsDetailOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">✕</button>
                        
                        {/* Header của Modal */}
                        <div className="mb-4 border-b pb-4 shrink-0">
                            <h3 className="text-2xl font-bold text-gray-800">{selectedDetail.name}</h3>
                            <div className="flex gap-2 mt-2">
                                <span className={`px-2 py-1 text-xs font-semibold rounded ${selectedDetail.warehouse_type === 'CENTRAL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {selectedDetail.warehouse_type === 'CENTRAL' ? 'Kho Tổng' : 'Kho Nhánh'}
                                </span>
                                <span className={`px-2 py-1 text-xs font-semibold rounded ${selectedDetail.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {selectedDetail.is_active ? 'Đang hoạt động' : 'Đã khóa'}
                                </span>
                            </div>
                        </div>

                        {/* Nội dung có thể cuộn (Scrollable Content) */}
                        <div className="overflow-y-auto pr-2 grid grid-cols-1 lg:grid-cols-3 gap-6 text-sm text-gray-700">
                            
                            {/* Cột Trái: Cấu trúc & Nhân sự (Chiếm 1/3 không gian) */}
                            <div className="lg:col-span-1 space-y-6">
                                <div>
                                    <h4 className="font-bold text-lg mb-3 text-gray-800 flex items-center gap-2">
                                        🏢 Cấu trúc kho
                                    </h4>
                                    {selectedDetail.warehouse_type === 'BRANCH' && (
                                        <p className="bg-gray-50 p-3 rounded border border-gray-100">
                                            <span className="font-medium">Thuộc kho tổng: </span><br/>
                                            <span className="text-blue-600 font-semibold">{selectedDetail.parent?.name || `ID #${selectedDetail.parent_id}`}</span>
                                        </p>
                                    )}
                                    {selectedDetail.warehouse_type === 'CENTRAL' && (
                                        <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                            <p className="font-medium mb-2">Kho nhánh ({selectedDetail.branches?.length || 0}):</p>
                                            <ul className="space-y-1">
                                                {selectedDetail.branches?.length > 0 
                                                    ? selectedDetail.branches.map(b => (
                                                        <li key={b.id} className="text-gray-700 flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span> 
                                                            {b.name} {!b.is_active && <span className="text-red-500 text-xs">(Đã khóa)</span>}
                                                        </li>
                                                    ))
                                                    : <li className="text-gray-500 italic">Chưa có kho nhánh</li>
                                                }
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Nhân sự */}
                                <div>
                                    <h4 className="font-bold text-lg mb-3 text-gray-800 flex items-center gap-2">
                                        👥 Nhân sự ({selectedDetail.users?.length || 0})
                                    </h4>
                                    <ul className="space-y-2 max-h-64 overflow-y-auto">
                                        {selectedDetail.users?.length > 0 ? selectedDetail.users.map(u => (
                                            <li key={u.id} className="bg-gray-50 p-3 rounded border border-gray-100 flex flex-col">
                                                {/* Hiển thị rõ Full name và Email theo schema API mới */}
                                                <span className="font-semibold text-gray-800">{u.full_name || 'Chưa cập nhật tên'}</span>
                                                <span className="text-gray-500 text-xs mt-1">{u.email || 'Chưa có email'}</span>
                                            </li>
                                        )) : <li className="text-gray-500 italic">Chưa có nhân sự...</li>}
                                    </ul>
                                </div>
                            </div>

                            {/* Cột Phải: Bảng Tồn Kho (Chiếm 2/3 không gian) */}
                            <div className="lg:col-span-2">
                                <h4 className="font-bold text-lg mb-3 text-gray-800 flex items-center gap-2">
                                    📦 Tồn kho hiện tại ({selectedDetail.stocks?.length || 0} mã)
                                </h4>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="max-h-96 overflow-y-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-100 text-gray-700 sticky top-0 shadow-sm">
                                                <tr>
                                                    {/* Bổ sung các cột hiển thị SKU và Tên Sản phẩm */}
                                                    <th className="p-3 font-semibold">SKU</th>
                                                    <th className="p-3 font-semibold">Tên Sản Phẩm</th>
                                                    <th className="p-3 font-semibold text-right">Tồn kho</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {selectedDetail.stocks?.length > 0 ? (
                                                    selectedDetail.stocks.map(s => (
                                                        <tr key={s.id} className="hover:bg-blue-50 transition-colors bg-white">
                                                            <td className="p-3 text-gray-600 font-medium">{s.product?.sku || '-'}</td>
                                                            <td className="p-3 text-gray-800">{s.product?.name || '-'}</td>
                                                            <td className="p-3 text-right">
                                                                <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded-full font-bold">
                                                                    {s.quantity}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="3" className="p-8 text-center text-gray-500 bg-white">
                                                            Kho này hiện đang trống.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Nút Đóng */}
                        <div className="mt-6 pt-4 border-t flex justify-end shrink-0">
                            <button onClick={() => setIsDetailOpen(false)} className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Warehouse;