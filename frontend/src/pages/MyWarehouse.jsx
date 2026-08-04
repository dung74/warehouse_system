import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { warehouseService } from '../services/warehouseService';
import { stockService } from '../services/stockService';
import { productService } from '../services/productService';

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL;

const MyWarehouse = () => {
    // --- THÔNG TIN KHO (CỘT TRÁI) ---
    const warehouseId = localStorage.getItem('warehouse_id');
    const [warehouse, setWarehouse] = useState(null);
    const [isLoadingWarehouse, setIsLoadingWarehouse] = useState(true);

    // --- THÔNG TIN STOCK PHÂN TRANG (CỘT PHẢI) ---
    const [stocks, setStocks] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const limit = 10;

    // Quản lý param trên URL
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const product_name = searchParams.get('product_name') || '';
    const sort_desc = searchParams.get('sort_desc');

    const [searchInput, setSearchInput] = useState(product_name);

    // --- MODAL CHI TIẾT SẢN PHẨM ---
    const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
    const [productDetail, setProductDetail] = useState(null);
    const [isLoadingProduct, setIsLoadingProduct] = useState(false);

    // --- HÀM CẬP NHẬT URL PARAMS ---
    const updateURLParams = (newParams) => {
        const currentParams = Object.fromEntries(searchParams.entries());
        const mergedParams = { ...currentParams, ...newParams };

        Object.keys(mergedParams).forEach(key => {
            if (mergedParams[key] === '' || mergedParams[key] === null || mergedParams[key] === undefined) {
                delete mergedParams[key];
            }
        });
        setSearchParams(mergedParams);
    };

    // --- LẤY THÔNG TIN KHO (CHẠY 1 LẦN) ---
    useEffect(() => {
        
        const fetchDetail = async () => {
            if (!warehouseId) return;
            setIsLoadingWarehouse(true);
            try {
                const data = await warehouseService.getDetail(warehouseId);
                setWarehouse(data);
            } catch (error) {
                console.error("Error fetching my warehouse:", error);
                alert("Không thể tải thông tin kho của bạn.");
            } finally {
                setIsLoadingWarehouse(false);
            }
        };
        fetchDetail();
    }, [warehouseId]);

    // --- TÌM KIẾM DEBOUNCE (CHỜ 0.5s MỚI GỌI API) ---
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== product_name) {
                updateURLParams({ product_name: searchInput, page: 1 });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // --- LẤY DANH SÁCH TỒN KHO THEO PHÂN TRANG ---
    useEffect(() => {
        const fetchStocks = async () => {
            if (!warehouseId) return;
            try {
                const params = {
                    skip: (page - 1) * limit,
                    limit: limit,
                    warehouse_id: warehouseId // Ép cứng luôn lấy stock của kho này
                };

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
        fetchStocks();
    }, [searchParams, warehouseId]);

    const handleReset = () => {
        setSearchInput('');
        setSearchParams({});
    };

    const toggleSort = () => {
        let nextSort = null;
        if (!sort_desc) nextSort = 'true';
        else if (sort_desc === 'true') nextSort = 'false';
        updateURLParams({ sort_desc: nextSort, page: 1 });
    };

    const handleViewProduct = async (id) => {
        setIsLoadingProduct(true);
        try {
            const data = await productService.getDetail(id);
            setProductDetail(data);
            setIsProductDetailOpen(true);
        } catch (error) {
            alert(error.response?.data?.detail || "Unable to load product details.");
        } finally {
            setIsLoadingProduct(false);
        }
    };

    const totalPages = Math.ceil(totalRows / limit) || 1;
    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    const formatDate = (dateString) => {
        if (!dateString) return "Not available";
        return new Date(dateString).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    if (isLoadingWarehouse) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!warehouse) return <div className="text-gray-500">No warehouse data found.</div>;

    // Tính tổng số lượng hàng trong kho (tính tổng quantity của trang hiện tại hoặc có thể để trống nếu API không trả về sum)
    const totalStaff = warehouse.users?.length || 0;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{warehouse.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">My Workplace Overview</p>
                </div>
                <div className="flex gap-2">
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${warehouse.warehouse_type === 'CENTRAL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {warehouse.warehouse_type === 'CENTRAL' ? 'Central' : 'Branch'}
                    </span>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${warehouse.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {warehouse.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Unique Products in Stock</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">{totalRows}</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-xl">
                        📦
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Assigned Staff</p>
                        <p className="text-3xl font-bold text-amber-600 mt-2">{totalStaff}</p>
                    </div>
                    <div className="h-12 w-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center text-xl">
                        👥
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-sm text-gray-700">
                {/* --- CỘT TRÁI: Cấu trúc & Nhân sự --- */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h4 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Structure</h4>
                        {warehouse.warehouse_type === 'BRANCH' && (
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="font-medium text-gray-500">Parent warehouse: </span><br />
                                <span className="text-blue-600 font-bold text-base">{warehouse.parent?.name || `ID #${warehouse.parent_id}`}</span>
                            </div>
                        )}
                        {warehouse.warehouse_type === 'CENTRAL' && (
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="font-medium mb-2 text-gray-500">Sub-branches</p>
                                <ul className="space-y-2">
                                    {warehouse.branches?.length > 0
                                        ? warehouse.branches.map(b => (
                                            <li key={b.id} className="text-gray-700 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                    {b.name}
                                                </div>
                                                {!b.is_active && <span className="text-red-500 text-xs font-semibold px-2 py-0.5 bg-red-50 rounded">Inactive</span>}
                                            </li>
                                        ))
                                        : <li className="text-gray-400 italic">No branches available</li>
                                    }
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h4 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Team Members</h4>
                        <ul className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                            {warehouse.users?.length > 0 ? warehouse.users.map(u => (
                                <li key={u.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col">
                                    <span className="font-semibold text-gray-800">{u.full_name || 'Name not available'}</span>
                                    <span className="text-gray-500 text-xs mt-1">{u.email || 'No email available'}</span>
                                </li>
                            )) : <li className="text-gray-400 italic">No staff assigned</li>}
                        </ul>
                    </div>
                </div>

                {/* --- CỘT PHẢI: Bảng Tồn Kho Phân Trang (Bê từ Stocks.jsx) --- */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
                    
                    {/* Thanh công cụ tìm kiếm */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl flex flex-col sm:flex-row gap-3 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Search product in this warehouse</label>
                            <input
                                type="text"
                                placeholder="Enter product name..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                        <button
                            onClick={handleReset}
                            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Clear
                        </button>
                    </div>

                    {/* Bảng dữ liệu */}
                    <div className="flex-1 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {/* Đã xóa cột Warehouse vì không cần thiết nữa */}
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase w-32">Product SKU</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Product name</th>
                                    <th
                                        className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-200 transition-colors group w-32"
                                        onClick={toggleSort}
                                    >
                                        Quantity {sort_desc === 'true' ? '↓' : sort_desc === 'false' ? '↑' : ''}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {stocks.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-16 text-center text-sm text-gray-500">
                                            No inventory records found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    stocks.map(stock => {
                                        const isOutOfStock = stock.quantity <= 0;
                                        return (
                                            <tr key={stock.id} className="hover:bg-blue-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                    {stock.product?.sku || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    <button
                                                        onClick={() => handleViewProduct(stock.product_id || stock.product?.id)}
                                                        disabled={isLoadingProduct}
                                                        className="text-gray-900 hover:text-blue-600 hover:underline transition-colors text-left block w-full disabled:opacity-50"
                                                        title="View product details"
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

                    {/* Phân trang */}
                    {totalPages > 1 && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between rounded-b-xl gap-4">
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{(page - 1) * limit + (stocks.length > 0 ? 1 : 0)}</span> to <span className="font-medium">{Math.min(page * limit, totalRows)}</span> of <span className="font-medium">{totalRows}</span>
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => updateURLParams({ page: Math.max(1, page - 1) })}
                                    disabled={page === 1}
                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    Prev
                                </button>
                                <span className="text-sm text-gray-600 px-2 font-medium">
                                    {page} / {totalPages}
                                </span>
                                <button
                                    onClick={() => updateURLParams({ page: Math.min(totalPages, page + 1) })}
                                    disabled={page === totalPages}
                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODAL CHI TIẾT SẢN PHẨM (GIỮ NGUYÊN) --- */}
            {isProductDetailOpen && productDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative overflow-hidden flex flex-col max-h-[90vh]">
                        <button onClick={() => setIsProductDetailOpen(false)} className="absolute top-4 right-4 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-600 z-10 transition-colors">
                            Close
                        </button>

                        <div className="flex flex-col md:flex-row overflow-y-auto">
                            {/* Khu vực Ảnh (Trái) */}
                            <div className="md:w-2/5 bg-gray-50 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-gray-200 min-h-[250px]">
                                {productDetail.image_path ? (
                                    <img src={`${IMAGE_BASE_URL}${productDetail.image_path}`} alt={productDetail.name} className="max-w-full max-h-[300px] rounded-lg shadow-sm object-contain" />
                                ) : (
                                    <div className="text-gray-400 text-center flex flex-col items-center">
                                        <p>No image available</p>
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
                                            {productDetail.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-2xl font-bold text-blue-600">
                                    {formatPrice(productDetail.base_price || 0)}
                                </div>

                                <div className="space-y-3 text-sm text-gray-700">
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <span className="font-semibold block mb-2 text-gray-800">Description</span>
                                        <p className="text-gray-600 whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                                            {productDetail.description || <span className="italic text-gray-400">No description available.</span>}
                                        </p>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <span className="font-semibold block mb-2 text-gray-800">Technical specifications</span>
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
                                                <span className="italic text-gray-400">No technical specifications available.</span>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyWarehouse;