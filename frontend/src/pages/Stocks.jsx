import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { stockService } from '../services/stockService';
import { productService } from '../services/productService';
import { warehouseService } from '../services/warehouseService';
import { Search, Filter, FileText, ChevronLeft, ChevronRight, RefreshCw, ArrowUpDown, ArrowDown, ArrowUp, Package, X, Image as ImageIcon } from 'lucide-react';

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL;

const Stocks = () => {
    
    const [stocks, setStocks] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const limit = 10;

    const [searchParams, setSearchParams] = useSearchParams();

    const page = parseInt(searchParams.get('page') || '1', 10);
    const warehouse_id = searchParams.get('warehouse_id') || '';
    const product_name = searchParams.get('product_name') || '';
    const sort_desc = searchParams.get('sort_desc');

    const [searchInput, setSearchInput] = useState(product_name);

    // --- STATES CHO MODAL CHI TIẾT KHO ---
    const [isWarehouseDetailOpen, setIsWarehouseDetailOpen] = useState(false);
    const [warehouseDetail, setWarehouseDetail] = useState(null);
    const [isLoadingWarehouse, setIsLoadingWarehouse] = useState(false);

    // --- STATES CHO MODAL CHI TIẾT SẢN PHẨM ---
    const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
    const [productDetail, setProductDetail] = useState(null);
    const [isLoadingProduct, setIsLoadingProduct] = useState(false);

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
        fetchStocks();
    }, [searchParams]);

    const fetchStocks = async () => {
        try {
            const params = {
                skip: (page -1) * limit,
                limit: limit,
            };

            if (warehouse_id) params.warehouse_id = Number(warehouse_id);
            if (product_name) params.product_name = product_name;

            if (sort_desc === 'true') params.sort_desc = true;
            if (sort_desc === 'false') params.sort_desc = false;

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
        else if (sort_desc === 'true') nextSort = 'false';

        updateURLParams({ sort_desc: nextSort, page: 1});
    };

    // --- HÀNH ĐỘNG XEM CHI TIẾT KHO ---
    const handleViewWarehouse = async (id) => {
        setIsLoadingWarehouse(true);
        try {
            const data = await warehouseService.getDetail(id);
            setWarehouseDetail(data);
            setIsWarehouseDetailOpen(true);
        } catch (error) {
            alert(error.response?.data?.detail || "Không thể tải chi tiết kho.");
        } finally {
            setIsLoadingWarehouse(false);
        }
    };

    // --- HÀNH ĐỘNG XEM CHI TIẾT SẢN PHẨM ---
    const handleViewProduct = async (id) => {
        setIsLoadingProduct(true);
        try {
            const data = await productService.getDetail(id);
            setProductDetail(data);
            setIsProductDetailOpen(true);
        } catch (error) {
            alert(error.response?.data?.detail || "Không thể tải chi tiết sản phẩm.");
        } finally {
            setIsLoadingProduct(false);
        }
    };

    const totalPages = Math.ceil(totalRows / limit) || 1;

    // --- HÀM FORMAT TIỀN TỆ & THỜI GIAN (GIỐNG TRANG PRODUCTS) ---
    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    const formatDate = (dateString) => {
        if (!dateString) return "Không có thông tin";
        return new Date(dateString).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen relative">
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
                <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Tìm theo Tên Sản phẩm</label>
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
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase w-48">Kho bãi</th>
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
                                    const wName = warehouses.find(w => w.id === stock.warehouse_id)?.name || `Kho #${stock.warehouse_id}`;
                                    const isOutOfStock = stock.quantity <= 0;
                                    
                                    return (
                                        <tr key={stock.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button 
                                                    onClick={() => handleViewWarehouse(stock.warehouse_id)}
                                                    disabled={isLoadingWarehouse}
                                                    className="text-blue-600 hover:text-blue-800 hover:underline transition-colors text-left disabled:opacity-50"
                                                    title="Xem chi tiết kho"
                                                >
                                                    {wName}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                {stock.product?.sku || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium">
                                                <button 
                                                    onClick={() => handleViewProduct(stock.product_id || stock.product?.id)}
                                                    disabled={isLoadingProduct}
                                                    className="text-gray-900 hover:text-blue-600 hover:underline transition-colors text-left block w-full disabled:opacity-50"
                                                    title="Xem chi tiết sản phẩm"
                                                >
                                                    {stock.product?.name || 'N/A'}
                                                </button>
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

            {/* --- MODAL CHI TIẾT KHO (GIỮ NGUYÊN BẢN CẬP NHẬT TRƯỚC) --- */}
            {isWarehouseDetailOpen && warehouseDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-4xl relative max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <button onClick={() => setIsWarehouseDetailOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 rounded-full p-1 transition-colors">
                            <X className="h-6 w-6" />
                        </button>
                        
                        <div className="mb-4 border-b pb-4 shrink-0 pr-8">
                            <h3 className="text-2xl font-bold text-gray-800">{warehouseDetail.name}</h3>
                            <div className="flex gap-2 mt-2">
                                <span className={`px-2 py-1 text-xs font-semibold rounded ${warehouseDetail.warehouse_type === 'CENTRAL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {warehouseDetail.warehouse_type === 'CENTRAL' ? 'Kho Tổng' : 'Kho Nhánh'}
                                </span>
                                <span className={`px-2 py-1 text-xs font-semibold rounded ${warehouseDetail.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {warehouseDetail.is_active ? 'Đang hoạt động' : 'Đã khóa'}
                                </span>
                            </div>
                        </div>

                        <div className="overflow-y-auto pr-2 grid grid-cols-1 lg:grid-cols-3 gap-6 text-sm text-gray-700">
                            {/* Cột trái */}
                            <div className="lg:col-span-1 space-y-6">
                                <div>
                                    <h4 className="font-bold text-lg mb-3 text-gray-800">🏢 Cấu trúc kho</h4>
                                    {warehouseDetail.warehouse_type === 'BRANCH' && (
                                        <p className="bg-gray-50 p-3 rounded border border-gray-100">
                                            <span className="font-medium">Thuộc kho tổng: </span><br/>
                                            <span className="text-blue-600 font-semibold">{warehouseDetail.parent?.name || `ID #${warehouseDetail.parent_id}`}</span>
                                        </p>
                                    )}
                                    {warehouseDetail.warehouse_type === 'CENTRAL' && (
                                        <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                            <p className="font-medium mb-2">Kho nhánh ({warehouseDetail.branches?.length || 0}):</p>
                                            <ul className="space-y-1">
                                                {warehouseDetail.branches?.length > 0 
                                                    ? warehouseDetail.branches.map(b => (
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
                                <div>
                                    <h4 className="font-bold text-lg mb-3 text-gray-800">👥 Nhân sự ({warehouseDetail.users?.length || 0})</h4>
                                    <ul className="space-y-2 max-h-64 overflow-y-auto">
                                        {warehouseDetail.users?.length > 0 ? warehouseDetail.users.map(u => (
                                            <li key={u.id} className="bg-gray-50 p-3 rounded border border-gray-100 flex flex-col">
                                                <span className="font-semibold text-gray-800">{u.full_name || 'Chưa cập nhật tên'}</span>
                                                <span className="text-gray-500 text-xs mt-1">{u.email || 'Chưa có email'}</span>
                                            </li>
                                        )) : <li className="text-gray-500 italic">Chưa có nhân sự...</li>}
                                    </ul>
                                </div>
                            </div>
                            
                            {/* Cột phải */}
                            <div className="lg:col-span-2">
                                <h4 className="font-bold text-lg mb-3 text-gray-800">📦 Tồn kho tại đây ({warehouseDetail.stocks?.length || 0} mã)</h4>
                                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[400px] flex flex-col">
                                    <div className="overflow-y-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-100 text-gray-700 sticky top-0 shadow-sm">
                                                <tr>
                                                    <th className="p-3 font-semibold">SKU</th>
                                                    <th className="p-3 font-semibold">Tên Sản Phẩm</th>
                                                    <th className="p-3 font-semibold text-right">Tồn kho</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {warehouseDetail.stocks?.length > 0 ? (
                                                    warehouseDetail.stocks.map(s => (
                                                        <tr key={s.id} className="hover:bg-blue-50 bg-white">
                                                            <td className="p-3 text-gray-600 font-medium">{s.product?.sku || '-'}</td>
                                                            <td className="p-3 text-gray-800">{s.product?.name || '-'}</td>
                                                            <td className="p-3 text-right">
                                                                <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded-full font-bold">{s.quantity}</span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="3" className="p-8 text-center text-gray-500 bg-white">Kho này hiện đang trống.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t flex justify-end shrink-0">
                            <button onClick={() => setIsWarehouseDetailOpen(false)} className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL CHI TIẾT SẢN PHẨM (NÂNG CẤP GIỐNG TRANG PRODUCTS) --- */}
            {isProductDetailOpen && productDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative overflow-hidden flex flex-col max-h-[90vh]">
                        <button onClick={() => setIsProductDetailOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 z-10 transition-colors">
                            <X size={18} />
                        </button>

                        <div className="flex flex-col md:flex-row overflow-y-auto">
                            {/* Khu vực Ảnh (Trái) */}
                            <div className="md:w-2/5 bg-gray-50 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-gray-200 min-h-[250px]">
                                {productDetail.image_path ? (
                                    <img src={`${IMAGE_BASE_URL}${productDetail.image_path}`} alt={productDetail.name} className="max-w-full max-h-[300px] rounded-lg shadow-sm object-contain" />
                                ) : (
                                    <div className="text-gray-400 text-center flex flex-col items-center">
                                        <ImageIcon size={48} className="mb-2 text-gray-300" />
                                        <p>Chưa có hình ảnh</p>
                                    </div>
                                )}
                            </div>

                            {/* Khu vực Thông tin (Phải) */}
                            <div className="md:w-3/5 p-6 space-y-5">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{productDetail.name}</h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">SKU: <span className="font-semibold text-gray-800">{productDetail.sku}</span></span>
                                        <span className={`text-xs px-2 py-1 rounded font-medium ${productDetail.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {productDetail.is_active ? 'Đang kinh doanh' : 'Ngừng bán'}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-2xl font-bold text-blue-600">
                                    {formatPrice(productDetail.base_price || 0)}
                                </div>

                                <div className="space-y-3 text-sm text-gray-700">
                                    {/* Khối Mô tả */}
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <span className="font-semibold block mb-2 text-gray-800">Mô tả sản phẩm:</span>
                                        <p className="text-gray-600 whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                                            {productDetail.description || <span className="italic text-gray-400">Không có mô tả.</span>}
                                        </p>
                                    </div>
                                    
                                    {/* Khối Thuộc tính */}
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <span className="font-semibold block mb-2 text-gray-800">Thuộc tính kỹ thuật:</span>
                                        {(() => {
                                            let parsedAttrs = {};
                                            try {
                                                parsedAttrs = typeof productDetail.attributes === 'string' 
                                                    ? JSON.parse(productDetail.attributes) 
                                                    : (productDetail.attributes || {});
                                            } catch(e) {}

                                            return Object.keys(parsedAttrs).length > 0 ? (
                                                <ul className="space-y-1">
                                                    {Object.entries(parsedAttrs).map(([k, v]) => (
                                                        <li key={k} className="flex border-b border-gray-200 pb-1 last:border-0 last:pb-0">
                                                            <span className="w-1/3 text-gray-500 font-medium">{k}:</span>
                                                            <span className="w-2/3 text-gray-800">{v}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="italic text-gray-400">Không có thông số kỹ thuật.</span>
                                            );
                                        })()}
                                    </div>

                                    {/* Ngày tạo */}
                                    <div className="flex justify-between pt-2 px-1">
                                        <span className="font-semibold text-gray-500">Ngày tạo:</span>
                                        <span className="text-gray-800 font-medium">{formatDate(productDetail.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200 mt-auto">
                            <button onClick={() => setIsProductDetailOpen(false)} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors shadow-sm font-medium">
                                Đóng cửa sổ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Stocks;