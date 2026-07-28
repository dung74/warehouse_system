import React, { useEffect, useState } from 'react';
import { stockService } from '../services/stockService';
import { productService } from '../services/productService';
import { warehouseService } from '../services/warehouseService';


const Stocks = () =>{
    const [stocks, setStocks] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [filterWarehouse, setFilterWarehouse] = useState('');

    useEffect(() => { fetchMasterData(); }, []);
    useEffect(() => { fetchStocks(); }, [filterWarehouse]);

    const fetchMasterData = async () => {
        const [productData, whData] = await Promise.all([productService.getAll(), warehouseService.getAll()]);
        setProducts(productData);
        setWarehouses(whData);
    }
    const fetchStocks = async () => {
        const data = await stockService.getAll(filterWarehouse);
        setStocks(data);
    }

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Kiểm tra Tồn Kho</h2>
                
                {/* BỘ LỌC KHO */}
                <select 
                    value={filterWarehouse} 
                    onChange={(e) => setFilterWarehouse(e.target.value)}
                    style={{ padding: '8px', minWidth: '200px' }}
                >
                    <option value="">Tất cả kho</option>
                    {warehouses.map(w => (
                        <option key={w.id} value={w.id}>
                            {w.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* BẢNG HIỂN THỊ TỒN KHO */}
            <table border="1" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr>
                        <th style={{ padding: '10px' }}>Kho</th>
                        <th style={{ padding: '10px' }}>Mã SKU</th>
                        <th style={{ padding: '10px' }}>Tên SP</th>
                        <th style={{ padding: '10px' }}>Số lượng tồn</th>
                    </tr>
                </thead>
                <tbody>
                    {stocks.length > 0 ? (
                        stocks.map(s => {
                            // Map dữ liệu id ra tên
                            const pName = products.find(p => p.id === s.product_id)?.name || 'N/A';
                            const pSku = products.find(p => p.id === s.product_id)?.sku || 'N/A';
                            const wName = warehouses.find(w => w.id === s.warehouse_id)?.name || 'N/A';
                            
                            return (
                                <tr key={s.id}>
                                    <td style={{ padding: '10px' }}>{wName}</td>
                                    <td style={{ padding: '10px' }}>{pSku}</td>
                                    <td style={{ padding: '10px' }}>{pName}</td>
                                    <td style={{ padding: '10px' }}>
                                        <strong style={{ color: s.quantity > 0 ? 'green' : 'red' }}>
                                            {s.quantity}
                                        </strong>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>
                                Chưa có dữ liệu tồn kho
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Stocks;