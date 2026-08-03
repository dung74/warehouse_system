import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { stockService } from '../services/stockService';
import { productService } from '../services/productService';
import { warehouseService } from '../services/warehouseService';
import { Search, Filter, FileText, ChevronLeft, ChevronRight, RefreshCw, ArrowUpDown, ArrowDown, ArrowUp, Package } from 'lucide-react';


const Stocks = () =>{
    
    const [stocks, setStocks] = useState([]);
    // const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const limit = 10;

    const [searchParams, setSearchParams] = useSearchParams();

    const page = parseInt(searchParams.get('page') || '1', 10);
    const warehouse_id = searchParams.get('warehouse_id') || '';
    const product_name = searchParams.get('product_name') || '';
    const sort_desc = searchParams.get('sort_desc') ;


    const[searchInput, setSearchInput] = useState(product_name);


    const updateURLParams = (newParams) => {
        const currentParams = Object.fromEntries(searchParams.entries());
        const mergedParams = {...currentParams, ...newParams};

        Object.keys(mergedParams).forEach(key => {
            if (mergedParams[key] === '' || mergedParams[key] === null || mergedParams[key] === undefined) {
                delete mergedParams[key];
            }
        });
        setSearchParams(mergedParams);
    };

    useEffect(() => {
        warehouseService.getAll().then(setWarehouses).catch(console.error);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== product_name) {
                updateURLParams({ product_name: searchInput, page: 1});
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        fetchStocks() ;

    }, [searchParams]);

    const fetchStocks = async () => {
        try {
            const params = {
                skip: (page -1) * limit,
                limit: limit,
            };

            if (warehouse_id) params.warehouse_id = Number(warehouse_id);
            if (product_name) params.product_name = product_name;

            if (sort_desc == 'true') params.sort_desc = true;
            if (sort_desc == 'false') params.sort_desc = false;

            const data = await stockService.getAll(params);
            setStocks(data.items || []);
            setTotalRows(data.total || 0);
        } catch (error) {
            console.error('Error fetching stocks:', error);
        }

    };

    const handleReset = () => {
        setSearchInput('');
        setSearchParams({});

    };

    const toggleSort = () => {
        let nextSort = null;
        if (!sort_desc) nextSort = 'true';
        else  if (sort_desc === 'true') nextSort = 'false';

        updateURLParams({ sort_desc: nextSort, page: 1});

    };

    const totalPages = Math.ceil(totalRows / limit) || 1;



    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
            {/* --- HEADER --- */}
            <div className="mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Tra cứu Tồn kho</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Theo dõi số lượng hàng hóa thực tế tại các kho.
                    </p>
                </div>
            </div>

            {/* --- THANH BỘ LỌC --- */}
            <div className="bg-white p-4 shadow-sm ring-1 ring-gray-900/5 rounded-xl mb-6 flex flex-col md:flex-row gap-4 items-end">
                {/* Search Input */}
                <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Tìm theo Tên</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Nhập từ khóa..." 
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="block w-full pl-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                </div>
                
                {/* Select Kho */}
                <div className="w-full md:w-64">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Chọn Kho</label>
                    <select 
                        value={warehouse_id}
                        onChange={(e) => updateURLParams({ warehouse_id: e.target.value, page: 1 })}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none bg-white"
                    >
                        <option value="">-- Tất cả kho --</option>
                        {warehouses.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </select>
                </div>
                
                {/* Nút Xóa Lọc */}
                <button 
                    onClick={handleReset} 
                    className="w-full md:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <RefreshCw className="mr-2 h-4 w-4 text-gray-500" /> Xóa Lọc
                </button>
            </div>

            {/* --- BẢNG DỮ LIỆU --- */}
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase w-48">Kho</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase w-32">Mã SP (SKU)</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Tên Sản phẩm</th>
                                <th 
                                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors group"
                                    onClick={toggleSort}
                                >
                                    <div className="flex items-center">
                                        Số lượng Tồn
                                        <span className="ml-2">
                                            {!sort_desc && <ArrowUpDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />}
                                            {sort_desc === 'true' && <ArrowDown className="h-4 w-4 text-blue-600" />}
                                            {sort_desc === 'false' && <ArrowUp className="h-4 w-4 text-blue-600" />}
                                        </span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {stocks.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-500">
                                        Không có dữ liệu tồn kho
                                    </td>
                                </tr>
                            ) : (
                                stocks.map(stock => {
                                    const wName = warehouses.find(w => w.id === stock.warehouse_id)?.name || stock.warehouse_id;
                                    const isOutOfStock = stock.quantity <= 0;
                                    
                                    return (
                                        <tr key={stock.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                                {wName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                {stock.product?.sku || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                {stock.product?.name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold border ${
                                                    isOutOfStock ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                }`}>
                                                    {stock.quantity.toLocaleString('vi-VN')}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- ĐIỀU HƯỚNG PHÂN TRANG --- */}
                {totalPages > 1 && (
                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                        <p className="text-sm text-gray-700">
                            Hiển thị <span className="font-medium">{(page - 1) * limit + (stocks.length > 0 ? 1 : 0)}</span> đến <span className="font-medium">{Math.min(page * limit, totalRows)}</span> trong số <span className="font-medium">{totalRows}</span> kết quả
                        </p>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => updateURLParams({ page: Math.max(1, page - 1) })}
                                disabled={page === 1}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" /> Trước
                            </button>
                            <span className="text-sm text-gray-600 px-2">
                                Trang {page} / {totalPages}
                            </span>
                            <button 
                                onClick={() => updateURLParams({ page: Math.min(totalPages, page + 1) })}
                                disabled={page === totalPages}
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