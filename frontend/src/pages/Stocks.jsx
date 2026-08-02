import React, { useEffect, useState } from 'react';
import { stockService } from '../services/stockService';
import { productService } from '../services/productService';
import { warehouseService } from '../services/warehouseService';
import { Search, Filter, FileText, ChevronLeft, ChevronRight, RefreshCw, ArrowUpDown, ArrowDown, ArrowUp, Package } from 'lucide-react';


const Stocks = () =>{
    
    const [stocks, setStocks] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);

    const [totalRows, setTotalRows] = useState(0);
    const limit = 10;


    const [currentPage, setCurrentPage] = useState(() => {
        const savedPage = sessionStorage.getItem('stocks_page');
        return savedPage ? Number(savedPage) : 1;

    });

    const [searchInput, setSearchInput] = useState(() => {
        const savedSearch = sessionStorage.getItem('stocks_search');
        return savedSearch ? JSON.parse(savedSearch) : { warehouse_id: '', product_name: '' };
    });

    const [filters, setFilters] = useState(() => {
        const savedFilters = sessionStorage.getItem('stocks_filters');
        return savedFilters ? JSON.parse(savedFilters) : { warehouse_id: '', product_name: '' };

    });

    const [sortDesc, setSortDesc] = useState(() => {
        const savedSort = sessionStorage.getItem('stocks_sort');
        return savedSort ? JSON.parse(savedSort) : null;
    });

    useEffect(() => {
        sessionStorage.setItem('stocks_page', currentPage);

    }, [currentPage]);

    useEffect(() => {
        sessionStorage.setItem('stocks_search', JSON.stringify(searchInput));
    }, [searchInput]);

    useEffect(() => {
        sessionStorage.setItem('stocks_filters', JSON.stringify(filters));
    }, [filters]);

    useEffect(() => {
        sessionStorage.setItem('stocks_sort', JSON.stringify(sortDesc));
    }, [sortDesc]);

    useEffect(() => {
        loadDropdownData();
    }, []);

    useEffect(() => {
        loadStocks();
    }, [currentPage, filters, sortDesc]);

    const loadDropdownData = async () => {
        try {
            const [pData, wData] = await Promise.all([
                productService.getAll(),
                warehouseService.getAll()
            ]);
            setProducts(pData);
            setWarehouses(wData);
        } catch (error) {
            console.error('Error loading dropdown data:', error);
        }
    };

    const loadStocks = async () => {
        try {
            const params = {
                skip: (currentPage - 1) * limit,
                limit: limit,

            };
            if (filters.warehouse_id) params.warehouse_id = Number(filters.warehouse_id);
            if (filters.product_name) params.product_name = filters.product_name;
            if (sortDesc !== null) params.sort_desc = sortDesc;

            const data = await stockService.getAll(params);

            setStocks(data.items || []);
            setTotalRows(data.total || 0);
        } catch (error) {
            console.error('Error loading stocks:', error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setFilters(searchInput);
        setCurrentPage(1);
    }

    const handleReset = () => {
        const emptyFilters = { warehouse_id: '', product_name: '' };
        setSearchInput(emptyFilters);
        setFilters(emptyFilters);
        setSortDesc(null);
        setCurrentPage(1);
    }

    const toggleSort = () => {
        if (sortDesc === null) setSortDesc(true);
        else if (sortDesc === true) setSortDesc(false);
        else setSortDesc(null);
        setCurrentPage(1);  
    }

    const totalPages = Math.ceil(totalRows / limit);


    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Kiểm tra Tồn Kho</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Theo dõi số lượng hàng hóa thực tế tại các kho.
                    </p>
                </div>
            </div>

            {/* Thanh Bộ Lọc */}
            <div className="bg-white p-4 shadow-sm ring-1 ring-gray-900/5 rounded-xl mb-6">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Tìm theo tên sản phẩm</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Nhập tên sản phẩm..." 
                                value={searchInput.product_name}
                                onChange={e => setSearchInput({...searchInput, product_name: e.target.value})}
                                className="block w-full pl-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>
                    
                    <div className="w-full md:w-64">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Lọc theo kho</label>
                        <select 
                            value={searchInput.warehouse_id}
                            onChange={e => setSearchInput({...searchInput, warehouse_id: e.target.value})}
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none bg-white"
                        >
                            <option value="">-- Tất cả kho --</option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Các nút bấm */}
                    <div className="flex w-full md:w-auto gap-2">
                        <button type="button" onClick={handleReset} className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                            <RefreshCw className="mr-2 h-4 w-4 text-gray-500" /> Làm mới
                        </button>
                        <button type="submit" className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors">
                            <Filter className="mr-2 h-4 w-4" /> Tìm kiếm
                        </button>
                    </div>
                </form>
            </div>

            {/* Bảng Hiển Thị Dữ Liệu */}
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase w-48">Kho</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase w-32">Mã SKU</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Tên Sản phẩm</th>
                                <th 
                                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors group"
                                    onClick={toggleSort}
                                >
                                    <div className="flex items-center">
                                        Số lượng tồn
                                        <span className="ml-2">
                                            {sortDesc === null && <ArrowUpDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />}
                                            {sortDesc === true && <ArrowDown className="h-4 w-4 text-blue-600" />}
                                            {sortDesc === false && <ArrowUp className="h-4 w-4 text-blue-600" />}
                                        </span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {stocks.length > 0 ? (
                                stocks.map(s => {
                                    const p = products.find(p => p.id === s.product_id) || {};
                                    const wName = warehouses.find(w => w.id === s.warehouse_id)?.name || 'N/A';
                                    const isOutOfStock = s.quantity <= 0;
                                    const isLowStock = s.quantity > 0 && s.quantity <= 10;

                                    return (
                                        <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                                {wName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                {p.sku || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                {p.name || `Product ID: ${s.product_id}`}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold border ${
                                                    isOutOfStock ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                    isLowStock ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                }`}>
                                                    {s.quantity}
                                                </span>
                                                {isLowStock && <span className="ml-2 text-xs text-amber-600">Sắp hết</span>}
                                                {isOutOfStock && <span className="ml-2 text-xs text-rose-600">Hết hàng</span>}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-gray-100 p-3 rounded-full mb-4">
                                                <FileText className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-sm font-medium text-gray-900">Chưa có dữ liệu tồn kho</h3>
                                            <p className="mt-1 text-sm text-gray-500">Thử làm mới bộ lọc để tìm kiếm lại.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Phân Trang */}
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

export default Stocks;