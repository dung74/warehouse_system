import React, { useEffect, useState } from 'react';
import { transactionService } from '../services/transactionService';
import { productService } from '../services/productService';
import { warehouseService } from '../services/warehouseService';
import { Plus, X, Search, ArrowDownToLine, ArrowUpFromLine, Filter, FileText, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [totalRows, setTotalRows] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0); // State mới để ép tải lại bảng khi thêm thành công
    const limit = 10;


    const [currentPage, setCurrentPage] = useState(() =>{
        const savedPage = sessionStorage.getItem('tx_page');
        return savedPage ? Number(savedPage) : 1;
    });


    const [searchInput, setSearchInput] = useState(() => {
        const savedSearch = sessionStorage.getItem('tx_search');
        return savedSearch ? JSON.parse(savedSearch) : {
            product_name: '',
            start_date: '',
            end_date: ''
        };
    });

    const [filters, setFilters] = useState(() => {
        const savedFilters = sessionStorage.getItem('tx_filters');
        return savedFilters ? JSON.parse(savedFilters) : {
            product_name: '',
            start_date: '',
            end_date: ''
        };
    });
    
    const [formData, setFormData] = useState({
        product_id: '',
        warehouse_id: '',
        transaction_type: 'IN',
        quantity_change: 1,
        reference_code: '',
        user_id: 3   // Hardcoded user_id cho demo
    });

    useEffect(() => {
        sessionStorage.setItem('tx_page', currentPage);
    },[currentPage]);
    
    useEffect(() => {
        sessionStorage.setItem('tx_search', JSON.stringify(searchInput));
    },[searchInput]);
    
    useEffect(() => {
        sessionStorage.setItem('tx_filters', JSON.stringify(filters));
    }, [filters]);

    useEffect(() => {
        loadDropdownData();
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [currentPage, filters, refreshTrigger]);

    const loadDropdownData = async () => {
        try {
            const [pData, wData] = await Promise.all([
                productService.getAll(),
                warehouseService.getAll()
            ]);
            setProducts(pData);
            setWarehouses(wData);

            if (pData.length > 0 && wData.length > 0) {
                setFormData(prev => ({...prev, product_id: pData[0].id, warehouse_id: wData[0].id}));
            }
        } catch (error) {
            console.error('Error loading dropdown data:', error);
        }
    };

    const fetchTransactions = async () => {
        try {
            const params = {
                skip: (currentPage - 1) * limit,
                limit: limit
            };

            if (filters.product_name) params.product_name = filters.product_name;
            if (filters.start_date) params.start_date = filters.start_date + 'T00:00:00';
            if (filters.end_date) params.end_date = filters.end_date + 'T23:59:59';

            const data = await transactionService.getAll(params);
            
            setTransactions(data.items || []);
            setTotalRows(data.total || 0);

        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setFilters(searchInput); 
        setCurrentPage(1); 
    };

    const handleReset= () => {
        const emptySearch = { product_name: '', start_date: '', end_date: '' };
        setSearchInput(emptySearch);
        setFilters(emptySearch);
        setCurrentPage(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                product_id: Number(formData.product_id),
                warehouse_id: Number(formData.warehouse_id),
                quantity_change: Number(formData.quantity_change),
            };
            await transactionService.create(payload);
            
            setFormData(prev => ({
                ...prev,
                quantity_change: 1,
                reference_code: ''
            }));
            setIsFormOpen(false);
            
            if (currentPage === 1) {
                setRefreshTrigger(prev => prev + 1); 
            } else {
                setCurrentPage(1); 
            }

        } catch (error) {
            alert(error.response?.data?.detail || 'Lỗi khi tạo giao dịch!');
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(totalRows / limit) || 1;
    const inputClass = "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm mt-1";

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Lịch sử Nhập / Xuất Kho</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Quản lý biến động số lượng hàng hóa và kiểm soát tồn kho.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button 
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm"
                    >
                        {isFormOpen ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                        {isFormOpen ? 'Hủy giao dịch' : 'Tạo Giao dịch mới'}
                    </button>
                </div>
            </div>

            {/* Form Tạo Giao dịch (Giữ nguyên) */}
            {isFormOpen && (
                <div className="bg-white p-6 shadow-sm ring-1 ring-gray-900/5 rounded-xl mb-6 transition-all">
                    {/* ... (Đoạn mã Form thêm mới giao dịch giữ nguyên như cũ) ... */}
                    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-4 mb-4">
                        Thông tin giao dịch
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Loại Giao dịch</label>
                            <select value={formData.transaction_type} onChange={(e) => setFormData({...formData, transaction_type: e.target.value})} className={inputClass}>
                                <option value="IN">NHẬP KHO (IN)</option>
                                <option value="OUT">XUẤT KHO (OUT)</option>
                            </select>
                        </div>

                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Sản phẩm</label>
                            <select value={formData.product_id} onChange={(e) => setFormData({...formData, product_id: e.target.value})} required className={inputClass}>
                                <option value="" disabled>-- Chọn sản phẩm --</option>
                                {products.map(p => (<option key={p.id} value={p.id}>{p.sku} - {p.name}</option>))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Kho hàng</label>
                            <select value={formData.warehouse_id} onChange={(e) => setFormData({...formData, warehouse_id: e.target.value})} required className={inputClass}>
                                <option value="" disabled>-- Chọn kho --</option>
                                {warehouses.map(w => (<option key={w.id} value={w.id}>{w.name}</option>))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Số lượng</label>
                            <input type="number" min="1" required value={formData.quantity_change} onChange={(e) => setFormData({...formData, quantity_change: e.target.value})} className={inputClass} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mã Phiếu (Tham chiếu)</label>
                            <input type="text" placeholder="VD: PO-2023-01" value={formData.reference_code} onChange={(e) => setFormData({...formData, reference_code: e.target.value})} className={inputClass} />
                        </div>

                        <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3 mt-2">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                            <button type="submit" disabled={loading} className={`inline-flex items-center px-6 py-2 rounded-lg text-white text-sm font-medium ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                {loading ? 'Đang xử lý...' : 'Xác nhận Giao dịch'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Thanh Công cụ & Lọc */}
            <div className="bg-white p-4 shadow-sm ring-1 ring-gray-900/5 rounded-xl mb-6">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Tìm theo sản phẩm</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Nhập tên hoặc mã SKU..." 
                                value={searchInput.product_name}
                                onChange={e => setSearchInput({...searchInput, product_name: e.target.value})}
                                className="block w-full pl-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="w-full md:w-48">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Từ ngày</label>
                        <input 
                            type="date" 
                            value={searchInput.start_date}
                            onChange={e => setSearchInput({...searchInput, start_date: e.target.value})}
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Đến ngày</label>
                        <input 
                            type="date" 
                            value={searchInput.end_date}
                            onChange={e => setSearchInput({...searchInput, end_date: e.target.value})}
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    
                    {/* CỤM NÚT LỌC VÀ LÀM MỚI */}
                    <div className="flex w-full md:w-auto gap-2">
                        <button type="button" onClick={handleReset} className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                            <RefreshCw className="mr-2 h-4 w-4 text-gray-500" /> Làm mới
                        </button>
                        <button type="submit" className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors">
                            <Filter className="mr-2 h-4 w-4" /> Lọc dữ liệu
                        </button>
                    </div>
                </form>
            </div>

            {/* Bảng Dữ liệu */}
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Thời gian</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Loại</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Sản phẩm</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Kho</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Số lượng</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Mã Phiếu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {transactions.length > 0 ? (
                                transactions.map((tx) => {
                                    const product = products.find(p => p.id === tx.product_id);
                                    const wName = warehouses.find(w => w.id === tx.warehouse_id)?.name || tx.warehouse_id;
                                    const isNhapkho = tx.transaction_type === 'IN';

                                    return (
                                        <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(tx.timestamp).toLocaleString('vi-VN', { hour12: false })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${isNhapkho ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                                    {isNhapkho ? <ArrowDownToLine className="mr-1 h-3 w-3"/> : <ArrowUpFromLine className="mr-1 h-3 w-3"/>}
                                                    {isNhapkho ? 'NHẬP' : 'XUẤT'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                {product ? `${product.sku} - ${product.name}` : `ID: ${tx.product_id}`}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {wName}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${isNhapkho ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {isNhapkho ? '+' : '-'}{tx.quantity_change}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                {tx.reference_code || '-'}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-gray-100 p-3 rounded-full mb-4">
                                                <FileText className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-sm font-medium text-gray-900">Không tìm thấy dữ liệu</h3>
                                            <p className="mt-1 text-sm text-gray-500">Thử làm mới bộ lọc hoặc thêm giao dịch mới.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Phân trang (Pagination) */}
                {totalPages > 1 && (
                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                        <p className="text-sm text-gray-700">
                            Đang xem <span className="font-medium">{totalRows === 0 ? 0 : (currentPage - 1) * limit + 1}</span> đến <span className="font-medium">{Math.min(currentPage * limit, totalRows)}</span> trong tổng số <span className="font-medium">{totalRows}</span> kết quả
                        </p>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" /> Trước
                            </button>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer disabled:cursor-not-allowed"
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