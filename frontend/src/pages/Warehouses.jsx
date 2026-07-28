import React, { useEffect, useState } from 'react';
import { warehouseService } from '../services/warehouseService';


const Warehouse = () => {
    const [warehouses, setWarehouses] = useState([]);
    const [formData, setFormData] = useState({ name: '', warehouse_type:  'BRANCH', parent_id: '' });

    useEffect(() => {fetchData(); }, []);

    const fetchData = async () => {
        const data = await warehouseService.getAll();
        setWarehouses(data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                parent_id: formData.warehouse_type === 'BRANCH' ? Number(formData.parent_id) : null
            };
            await warehouseService.create(payload);
            setFormData({ name: '', warehouse_type: 'BRANCH', parent_id: '' });
            fetchData();

        } catch (error) {
            alert('Error creating warehouse: ' + error.message);
        }
    };
    return (
        <div style={{ padding: '20px' }}>
            <h2>Quản lý Kho</h2>
            
            {/* FORM THÊM KHO */}
            <form onSubmit={handleSubmit} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <input 
                    type="text" 
                    placeholder="Nhập tên kho..."
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    required 
                />
                
                <select 
                    value={formData.warehouse_type}
                    onChange={(e) => setFormData({...formData, warehouse_type: e.target.value})}
                >
                    <option value="CENTRAL">Kho Tổng (CENTRAL)</option>
                    <option value="BRANCH">Kho Nhánh (BRANCH)</option>
                </select>

                {/* Chỉ hiện chọn kho tổng khi loại kho là Nhánh (BRANCH) */}
                {formData.warehouse_type === 'BRANCH' && (
                    <select 
                        value={formData.parent_id}
                        onChange={(e) => setFormData({...formData, parent_id: e.target.value})}
                        required
                    >
                        <option value="">-- Chọn Kho Tổng --</option>
                        {warehouses
                            .filter(w => w.warehouse_type === 'CENTRAL')
                            .map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))
                        }
                    </select>
                )}
                
                <button type="submit">Thêm Kho</button>
            </form>

            {/* BẢNG HIỂN THỊ DANH SÁCH KHO */}
            <table border="1" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr>
                        <th style={{ padding: '8px' }}>Tên Kho</th>
                        <th style={{ padding: '8px' }}>Loại</th>
                        <th style={{ padding: '8px' }}>Thuộc Kho Tổng</th>
                    </tr>
                </thead>
                <tbody>
                    {warehouses.length > 0 ? (
                        warehouses.map(w => (
                            <tr key={w.id}>
                                <td style={{ padding: '8px' }}>{w.name}</td>
                                <td style={{ padding: '8px' }}>
                                    {w.warehouse_type === 'CENTRAL' ? 'Kho Tổng' : 'Kho Nhánh'}
                                </td>
                                <td style={{ padding: '8px' }}>
                                    {warehouses.find(parent => parent.id === w.parent_id)?.name || '-'}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" style={{ padding: '8px', textAlign: 'center' }}>
                                Chưa có dữ liệu kho
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default Warehouse;