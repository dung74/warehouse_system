import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { transactionService } from '../services/transactionService';
import { warehouseService } from '../services/warehouseService';
import { productService } from '../services/productService'; // Thêm service này để search async
import { Search, Plus, Calendar, ArrowRightLeft, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

const Transactions = () => {
    // --- 1. QUẢN LÝ TRẠNG THÁI BẰNG URL ---
    const [searchParams, setSearchParams] = useSearchParams();
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const productNameParam = searchParams.get('product_name') || '';
    const startDateParam = searchParams.get('start_date') || '';
    const endDateParam = searchParams.get('end_date') || '';
    
    const limit = 10;

    const updateURLParams = (newValues) => {
        const params = new URLSearchParams(searchParams);
        Object.keys(newValues).forEach(key => {
            if (newValues[key]) {
                params.set(key, newValues[key]);
            } else {
                params.delete(key);
            }
        });
        setSearchParams(params);
    };

    // --- 2. STATE DỮ LIỆU BẢNG & BỘ LỌC ---
    const [transactions, setTransactions] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [warehouses, setWarehouses] = useState([]);
    const [tableSearchInput, setTableSearchInput] = useState(productNameParam);

    // --- 3. STATE CHO FORM TẠO MỚI & ASYNC SEARCH SẢN PHẨM ---
    const [formData, setFormData] = useState({
        warehouse_id: '',
        transaction_type: 'IN',
        quantity_change: 1,
        reference_code: ''
    });

    // Async Search States
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [productSuggestions, setProductSuggestions] = useState([]);
    const [isSearchingProduct, setIsSearchingProduct] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const dropdownRef = useRef(null); // Dùng để click ra ngoài thì ẩn dropdown

    // --- 4. EFFECTS ---
    
    // Tải danh sách kho
    useEffect(() => {
        warehouseService.getAll().then(setWarehouses).catch(console.error);
    }, []);

    // Debounce cho ô tìm kiếm trong Bảng lịch sử (Cập nhật URL)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (tableSearchInput !== productNameParam) {
                updateURLParams({ product_name: tableSearchInput, page: 1 });
            }
        }, 500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tableSearchInput]);

    // Lắng nghe URL thay đổi để gọi API Bảng giao dịch
    useEffect(() => {
        fetchTransactions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // **TÍNH NĂNG MỚI: Debounce ASYNC SEARCH Sản phẩm cho Form Tạo mới**
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (productSearchTerm.trim().length < 2) {
                setProductSuggestions([]);
                setShowSuggestions(false);
                return;
            }
            
            setIsSearchingProduct(true);
            try {
                // Gọi API lấy danh sách sản phẩm theo tên/sku đang gõ (chỉ lấy 5 kết quả)
                const data = await productService.getAll({ name: productSearchTerm, limit: 5 });
                setProductSuggestions(data.items || data);
                setShowSuggestions(true);
            } catch (error) {
                console.error("Lỗi tìm kiếm sản phẩm:", error);
            } finally {
                setIsSearchingProduct(false);
            }
        };

        const timer = setTimeout(fetchSuggestions, 400); // Đợi 400ms sau khi ngừng gõ mới gọi API
        return () => clearTimeout(timer);
    }, [productSearchTerm]);

    // Ẩn dropdown gợi ý khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    // --- 5. FUNCTIONS ---
    const fetchTransactions = async () => {
        try {
            const params = { skip: (page - 1) * limit, limit: limit };
            if (productNameParam) params.product_name = productNameParam;
            if (startDateParam) params.start_date = `${startDateParam}T00:00:00`;
            if (endDateParam) params.end_date = `${endDateParam}T23:59:59`;

            const data = await transactionService.getAll(params);
            setTransactions(data.items || []);
            setTotalRows(data.total || 0);
        } catch (error) {
            console.error("Lỗi tải giao dịch:", error);
        }
    };

    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        setProductSearchTerm(''); // Xóa text ô input
        setShowSuggestions(false);
    };

    const handleSubmitTransaction = async (e) => {
        e.preventDefault();
        if (!selectedProduct) return alert("Vui lòng tìm và chọn sản phẩm!");
        if (!formData.warehouse_id) return alert("Vui lòng chọn kho!");
        if (formData.quantity_change <= 0) return alert("Số lượng phải lớn hơn 0!");

        try {
            const payload = {
                ...formData,
                product_id: selectedProduct.id,
                warehouse_id: parseInt(formData.warehouse_id),
                quantity_change: parseInt(formData.quantity_change)
            };
            await transactionService.create(payload);
            alert("Tạo giao dịch thành công!");
            
            // Reset form
            setFormData({ warehouse_id: '', transaction_type: 'IN', quantity_change: 1, reference_code: '' });
            setSelectedProduct(null);
            
            // Đưa về trang 1 để xem giao dịch vừa tạo (Kích hoạt useEffect load lại bảng)
            updateURLParams({ page: 1 }); 
        } catch (error) {
            alert(error.response?.data?.detail || "Lỗi tạo giao dịch");
        }
    };

    const totalPages = Math.ceil(totalRows / limit) || 1;

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                    <ArrowRightLeft className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Quản lý Giao dịch</h2>
                    <p className="mt-1 text-sm text-gray-500">Tạo phiếu Nhập/Xuất kho và xem lịch sử luân chuyển.</p>
                </div>
            </div>

            {/* === PHẦN 1: FORM TẠO GIAO DỊCH === */}
            <div className="bg-white p-6 shadow-sm ring-1 ring-gray-900/5 rounded-xl mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Plus className="h-5 w-5 mr-2 text-indigo-500" /> Tạo Phiếu Nhập / Xuất
                </h3>
                
                <form onSubmit={handleSubmitTransaction} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Cột Trái: ASYNC SEARCH Sản phẩm */}
                    <div className="space-y-4">
                        <div className="relative" ref={dropdownRef}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">1. Tìm Tên Sản phẩm </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Gõ để tìm kiếm..." 
                                    value={productSearchTerm}
                                    onChange={(e) => setProductSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    onFocus={() => { if(productSuggestions.length > 0) setShowSuggestions(true); }}
                                />
                                {isSearchingProduct && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* Dropdown Gợi ý */}
                            {showSuggestions && productSuggestions.length > 0 && (
                                <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-sm ring-1 ring-black ring-opacity-5 overflow-auto">
                                    {productSuggestions.map((product) => (
                                        <li 
                                            key={product.id}
                                            onClick={() => handleSelectProduct(product)}
                                            className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 text-gray-900"
                                        >
                                            <span className="block font-medium truncate">{product.name}</span>
                                            <span className="block text-xs text-gray-500">SKU: {product.sku}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            
                            {/* Hiển thị sản phẩm đã chọn */}
                            {selectedProduct && (
                                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-green-800">{selectedProduct.name}</p>
                                        <p className="text-xs text-green-600">SKU: {selectedProduct.sku}</p>
                                        <button 
                                            type="button" 
                                            onClick={() => setSelectedProduct(null)}
                                            className="text-xs text-red-500 hover:text-red-700 mt-1 font-medium"
                                        >
                                            Hủy chọn
                                        </button>
                                    </div>
                                </div>
                            )}
                            {!selectedProduct && !productSearchTerm && (
                                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md flex items-center text-gray-500 text-sm">
                                    <AlertCircle className="h-4 w-4 mr-2" /> Chưa có sản phẩm nào được chọn.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cột Phải: Thông tin phiếu */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">2. Chọn Kho</label>
                                <select 
                                    required
                                    value={formData.warehouse_id}
                                    onChange={(e) => setFormData({...formData, warehouse_id: e.target.value})}
                                    className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="">-- Chọn kho --</option>
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">3. Loại Giao dịch</label>
                                <select 
                                    value={formData.transaction_type}
                                    onChange={(e) => setFormData({...formData, transaction_type: e.target.value})}
                                    className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                                >
                                    <option value="IN">Nhập kho (IN)</option>
                                    <option value="OUT">Xuất kho (OUT)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">4. Số lượng</label>
                                <input 
                                    type="number" min="1" required
                                    value={formData.quantity_change}
                                    onChange={(e) => setFormData({...formData, quantity_change: e.target.value})}
                                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">5. Mã chứng từ (Tùy chọn)</label>
                                <input 
                                    type="text" placeholder="VD: PO-2023-01"
                                    value={formData.reference_code}
                                    onChange={(e) => setFormData({...formData, reference_code: e.target.value})}
                                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button 
                                type="submit" 
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                Xác nhận Tạo Phiếu
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* === PHẦN 2: LỊCH SỬ GIAO DỊCH === */}
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Lịch sử Giao dịch</h3>
            
            {/* Thanh Bộ Lọc Bảng */}
            <div className="bg-white p-4 shadow-sm ring-1 ring-gray-900/5 rounded-xl mb-6 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Lọc theo Tên SP / SKU</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" placeholder="Gõ để lọc..." 
                            value={tableSearchInput}
                            onChange={(e) => setTableSearchInput(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Từ ngày</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="date" 
                            value={startDateParam}
                            onChange={(e) => updateURLParams({ start_date: e.target.value, page: 1 })}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Đến ngày</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="date" 
                            value={endDateParam}
                            onChange={(e) => updateURLParams({ end_date: e.target.value, page: 1 })}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
                
                <button 
                    onClick={() => { setTableSearchInput(''); setSearchParams({}); }} 
                    className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                    <RefreshCw className="mr-2 h-4 w-4 text-gray-500" /> Xóa lọc
                </button>
            </div>

            {/* Bảng Dữ Liệu */}
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Thời gian</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Loại</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Kho</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Mã SP (SKU)</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Sản phẩm</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Số lượng</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Chứng từ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-500">
                                        Không có giao dịch nào khớp với bộ lọc.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map(tx => {
                                    const wName = warehouses.find(w => w.id === tx.warehouse_id)?.name || tx.warehouse_id;
                                    const isIn = tx.transaction_type === 'IN';
                                    
                                    return (
                                        <tr key={tx.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(tx.timestamp).toLocaleString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    isIn ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                    {isIn ? 'NHẬP' : 'XUẤT'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{wName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{tx.product?.sku}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{tx.product?.name}</td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${isIn ? 'text-blue-600' : 'text-orange-600'}`}>
                                                {isIn ? '+' : '-'}{tx.quantity_change.toLocaleString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {tx.reference_code || '-'}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Phân Trang */}
                {totalPages > 1 && (
                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                        <p className="text-sm text-gray-700">
                            Hiển thị <span className="font-medium">{(page - 1) * limit + (transactions.length > 0 ? 1 : 0)}</span> đến <span className="font-medium">{Math.min(page * limit, totalRows)}</span> trong số <span className="font-medium">{totalRows}</span> kết quả
                        </p>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => updateURLParams({ page: Math.max(1, page - 1) })}
                                disabled={page === 1}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" /> Trước
                            </button>
                            <span className="text-sm text-gray-600 px-2">Trang {page} / {totalPages}</span>
                            <button 
                                onClick={() => updateURLParams({ page: Math.min(totalPages, page + 1) })}
                                disabled={page === totalPages}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                            >
                                Sau <ChevronRight className="h-4 w-4 ml-1" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Transactions;