import React, { useEffect, useState } from 'react';
import  { transactionService } from '../services/transactionService';
import { productService } from '../services/productService';
import {warehouseService} from '../services/warehouseService';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        product_id: '',
        warehouse_id: '',
        transaction_type: 'IN',
        quantity_change: 1,
        reference_code: '',
        user_id: 3   // Hardcoded user_id for demonstration purposes

    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const [txData, pData, wData] = await Promise.all([
            transactionService.getAll(),
            productService.getAll(),
            warehouseService.getAll()
        ]);
        setTransactions(txData);
        setProducts(pData);
        setWarehouses(wData);

        if (pData.length > 0 && wData.length > 0) {
            setFormData(prev => ({...prev, product_id: pData[0].id, warehouse_id: wData[0].id}));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try{
            const payload = {
                ...formData,
                product_id: Number(formData.product_id),
                warehouse_id: Number(formData.warehouse_id),
                quantity_change: Number(formData.quantity_change),
            };
            await transactionService.create(payload);
            alert('Transaction created successfully!');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.detail || 'Error creating transaction');
        }finally {
            setLoading(false);
        }

    };

    return (
        <div className="transactions-container">
            <h2>Nhập / Xuất Kho</h2>
            
            <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Sản phẩm: </label>
                    <select 
                        value={formData.product_id} 
                        onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                        required
                    >
                        <option value="" disabled>-- Chọn sản phẩm --</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.sku} - {p.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label>Kho: </label>
                    <select 
                        value={formData.warehouse_id} 
                        onChange={(e) => setFormData({...formData, warehouse_id: e.target.value})}
                        required
                    >
                        <option value="" disabled>-- Chọn kho --</option>
                        {warehouses.map(w => (
                            <option key={w.id} value={w.id}>
                                {w.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label>Loại Giao dịch: </label>
                    <select 
                        value={formData.transaction_type} 
                        onChange={(e) => setFormData({...formData, transaction_type: e.target.value})}
                    >
                        <option value="IN">NHẬP (IN)</option>
                        <option value="OUT">XUẤT (OUT)</option>
                    </select>
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label>Số lượng: </label>
                    <input 
                        type="number" 
                        min="1"
                        required
                        value={formData.quantity_change} 
                        onChange={(e) => setFormData({...formData, quantity_change: e.target.value})} 
                    />
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label>Mã Phiếu (Tham chiếu): </label>
                    <input 
                        type="text" 
                        value={formData.reference_code} 
                        onChange={(e) => setFormData({...formData, reference_code: e.target.value})} 
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Đang xử lý...' : 'Xác nhận Giao dịch'}
                </button>
            </form>

            <h2>Lịch sử Giao dịch</h2>
            <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>Thời gian</th>
                        <th>Loại</th>
                        <th>Sản phẩm</th>
                        <th>Kho</th>
                        <th>Số lượng</th>
                        <th>Mã Phiếu</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((tx, index) => {
                        // Tìm thông tin để hiển thị tên thay vì hiện ID
                        const pSku = products.find(p => p.id === tx.product_id)?.sku || tx.product_id;
                        const wName = warehouses.find(w => w.id === tx.warehouse_id)?.name || tx.warehouse_id;
                        
                        return (
                            <tr key={tx.id || index}>
                                <td>{new Date(tx.timestamp).toLocaleString('vi-VN')}</td>
                                <td style={{ 
                                    color: tx.transaction_type === 'IN' ? 'green' : 'red', 
                                    fontWeight: 'bold' 
                                }}>
                                    {tx.transaction_type}
                                </td>
                                <td>{pSku}</td>
                                <td>{wName}</td>
                                <td>{tx.quantity_change}</td>
                                <td>{tx.reference_code || '-'}</td>
                            </tr>
                        );
                    })}
                    {transactions.length === 0 && (
                        <tr>
                            <td colSpan="6" style={{ textAlign: 'center' }}>Chưa có giao dịch nào</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Transactions;