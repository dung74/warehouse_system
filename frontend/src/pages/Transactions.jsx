import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { transactionService } from '../services/transactionService';
import { warehouseService } from '../services/warehouseService';
import { productService } from '../services/productService';

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL;

const Transactions = () => {
    // --- 1. QUẢN LÝ TRẠNG THÁI BẰNG URL ---
    const [searchParams, setSearchParams] = useSearchParams();
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const statusParam = searchParams.get('status') || '';
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

    // --- 3. STATE CHO FORM TẠO MỚI (MASTER-DETAIL) ---
    const [formData, setFormData] = useState({
        warehouse_id: '',
        transaction_type: 'IN',
    });
    const [selectedItems, setSelectedItems] = useState([]);

    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [productSuggestions, setProductSuggestions] = useState([]);
    const [isSearchingProduct, setIsSearchingProduct] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const dropdownRef = useRef(null);

    // --- STATES CHO MODAL CHI TIẾT KHO ---
    const [isWarehouseDetailOpen, setIsWarehouseDetailOpen] = useState(false);
    const [warehouseDetail, setWarehouseDetail] = useState(null);
    const [isLoadingWarehouse, setIsLoadingWarehouse] = useState(false);

    // --- STATES CHO MODAL CHI TIẾT SẢN PHẨM ---
    const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
    const [productDetail, setProductDetail] = useState(null);
    const [isLoadingProduct, setIsLoadingProduct] = useState(false);

    // --- 4. EFFECTS ---
    useEffect(() => {
        warehouseService.getAll().then(setWarehouses).catch(console.error);
    }, []);

    useEffect(() => {
        fetchTransactions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // Async Search Sản phẩm
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (productSearchTerm.trim().length < 2) {
                setProductSuggestions([]);
                setShowSuggestions(false);
                return;
            }
            
            setIsSearchingProduct(true);
            try {
                const data = await productService.getAll({ name: productSearchTerm, limit: 5 });
                setProductSuggestions(data.items || data);
                setShowSuggestions(true);
            } catch (error) {
                console.error("Lỗi tìm kiếm sản phẩm:", error);
            } finally {
                setIsSearchingProduct(false);
            }
        };

        const timer = setTimeout(fetchSuggestions, 400);
        return () => clearTimeout(timer);
    }, [productSearchTerm]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- 5. FUNCTIONS: LẤY DỮ LIỆU ---
    const fetchTransactions = async () => {
        try {
            const params = { skip: (page - 1) * limit, limit: limit };
            if (statusParam) params.status = statusParam;
            if (startDateParam) params.start_date = `${startDateParam}T00:00:00`;
            if (endDateParam) params.end_date = `${endDateParam}T23:59:59`;

            const data = await transactionService.getAll(params);
            setTransactions(data.items || []);
            setTotalRows(data.total || 0);
        } catch (error) {
            console.error("Lỗi tải giao dịch:", error);
        }
    };

    // --- 6. FUNCTIONS: XỬ LÝ FORM TẠO PHIẾU ---
    const handleSelectProduct = (product) => {
        const existingItemIndex = selectedItems.findIndex(item => item.product_id === product.id);
        if (existingItemIndex >= 0) {
            const newItems = [...selectedItems];
            newItems[existingItemIndex].quantity += 1;
            setSelectedItems(newItems);
        } else {
            setSelectedItems([...selectedItems, { 
                product_id: product.id, 
                name: product.name, 
                sku: product.sku, 
                quantity: 1 
            }]);
        }
        setProductSearchTerm('');
        setShowSuggestions(false);
    };

    const handleUpdateQuantity = (productId, newQuantity) => {
        if (newQuantity === "") {
            setSelectedItems(selectedItems.map(item => 
                item.product_id === productId ? { ...item, quantity: "" } : item
            ));
            return;
        }

        const parsedQuantity = parseInt(newQuantity, 10);
        if (parsedQuantity < 1) return;

        setSelectedItems(selectedItems.map(item => 
            item.product_id === productId ? { ...item, quantity: parsedQuantity } : item
        ));
    };

    const handleRemoveItem = (productId) => {
        setSelectedItems(selectedItems.filter(item => item.product_id !== productId));
    };

    const handleSubmitDraft = async (e) => {
        e.preventDefault();
        if (!formData.warehouse_id) return alert("Please select a warehouse.");
        if (selectedItems.length === 0) return alert("Please add at least one product to the transaction.");

        try {
            const payload = {
                warehouse_id: parseInt(formData.warehouse_id),
                transaction_type: formData.transaction_type,
                details: selectedItems.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity
                }))
            };
            
            await transactionService.create(payload);
            alert("Draft transaction created successfully.");
            
            setFormData({ warehouse_id: '', transaction_type: 'IN' });
            setSelectedItems([]);
            updateURLParams({ page: 1 }); 
            fetchTransactions();
        } catch (error) {
            alert(error.response?.data?.detail || "Unable to create draft transaction.");
        }
    };

    // --- 7. FUNCTIONS: DUYỆT / HỦY PHIẾU ---
    const handleApprove = async (transactionId) => {
        if(!window.confirm("Are you sure you want to approve this transaction? Inventory quantities will be updated.")) return;
        try {
            await transactionService.approve(transactionId);
            alert("Transaction approved and inventory updated successfully.");
            fetchTransactions();
        } catch (error) {
            alert(error.response?.data?.detail || "Unable to approve transaction.");
        }
    };

    const handleCancel = async (transactionId) => {
        const reason = window.prompt("Enter a reason for cancellation:");
        if (!reason) return; 

        try {
            await transactionService.cancel(transactionId, reason);
            alert("Transaction canceled successfully.");
            fetchTransactions();
        } catch (error) {
            alert(error.response?.data?.detail || "Unable to cancel transaction.");
        }
    };

    // --- 8. XEM CHI TIẾT KHO VÀ SẢN PHẨM ---
    const handleViewWarehouse = async (id) => {
        setIsLoadingWarehouse(true);
        try {
            const data = await warehouseService.getDetail(id);
            setWarehouseDetail(data);
            setIsWarehouseDetailOpen(true);
        } catch (error) {
            alert(error.response?.data?.detail || "Unable to load warehouse details.");
        } finally {
            setIsLoadingWarehouse(false);
        }
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

    // --- UI HELPERS ---
    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    const formatDate = (dateString) => {
        if (!dateString) return "Not available";
        return new Date(dateString).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'DRAFT': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">DRAFT</span>;
            case 'APPROVED': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">APPROVED</span>;
            case 'CANCELED': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">CANCELED</span>;
            default: return status;
        }
    };

    const totalPages = Math.ceil(totalRows / limit) || 1;

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen relative">
            {/* Header */}
            <div className="mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
                    <p className="mt-1 text-sm text-gray-500">Create inbound and outbound transactions and track their status.</p>
                </div>
            </div>

            {/* === PHẦN 1: FORM TẠO PHIẾU NHÁP === */}
            <div className="bg-white p-6 shadow-sm ring-1 ring-gray-900/5 rounded-xl mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Create draft transaction</h3>
                
                <form onSubmit={handleSubmitDraft} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cột 1: Thông tin chung */}
                    <div className="space-y-4 lg:col-span-1">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction type</label>
                            <select 
                                value={formData.transaction_type}
                                onChange={(e) => setFormData({...formData, transaction_type: e.target.value})}
                                className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                            >
                                <option value="IN">Inbound</option>
                                <option value="OUT">Outbound</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                            <select 
                                required
                                value={formData.warehouse_id}
                                onChange={(e) => setFormData({...formData, warehouse_id: e.target.value})}
                                className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">Select a warehouse</option>
                                {warehouses.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Cột 2 & 3: Chi tiết sản phẩm */}
                    <div className="space-y-4 lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Add products</label>
                        <div className="relative" ref={dropdownRef}>
                            <div className="relative">
                                <input 
                                    type="text" placeholder="Search by name or SKU" 
                                    value={productSearchTerm}
                                    onChange={(e) => setProductSearchTerm(e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    onFocus={() => { if(productSuggestions.length > 0) setShowSuggestions(true); }}
                                />
                            </div>

                            {/* Dropdown Gợi ý */}
                            {showSuggestions && productSuggestions.length > 0 && (
                                <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-sm ring-1 ring-black ring-opacity-5 overflow-auto">
                                    {productSuggestions.map((product) => (
                                        <li 
                                            key={product.id}
                                            onClick={() => handleSelectProduct(product)}
                                            className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 text-gray-900 flex justify-between"
                                        >
                                            <span className="block font-medium truncate">{product.name}</span>
                                            <span className="block text-xs text-gray-500 ml-2">SKU: {product.sku}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Danh sách sản phẩm đã chọn */}
                        {selectedItems.length > 0 ? (
                            <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 w-32">Quantity</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 w-16">Remove</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {selectedItems.map((item) => (
                                            <tr key={item.product_id}>
                                                <td className="px-4 py-2 text-sm text-gray-900">
                                                    <div className="font-medium">{item.name}</div>
                                                    <div className="text-xs text-gray-500">SKU: {item.sku}</div>
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <input 
                                                        type="number" 
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleUpdateQuantity(item.product_id, e.target.value)}
                                                        onBlur={(e) => {
                                                            if (e.target.value === "" || parseInt(e.target.value) < 1) {
                                                                handleUpdateQuantity(item.product_id, 1);
                                                            }
                                                        }}
                                                        className="w-20 text-center rounded-md border border-gray-300 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button type="button" onClick={() => handleRemoveItem(item.product_id)} className="text-red-500 hover:text-red-700">
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="mt-3 p-4 bg-gray-50 border border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500">
                                <span className="text-sm">No products selected. Search to add products to this transaction.</span>
                            </div>
                        )}

                        <div className="pt-4 flex justify-end">
                            <button 
                                type="submit" 
                                className="inline-flex items-center justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                Save draft
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* === PHẦN 2: LỊCH SỬ PHIẾU KHO === */}
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction list</h3>
            
            {/* Thanh Bộ Lọc */}
            <div className="bg-white p-4 shadow-sm ring-1 ring-gray-900/5 rounded-xl mb-6 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                    <select 
                        value={statusParam}
                        onChange={(e) => updateURLParams({ status: e.target.value, page: 1 })}
                        className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">All statuses</option>
                        <option value="DRAFT">Draft</option>
                        <option value="APPROVED">Approved</option>
                        <option value="CANCELED">Canceled</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">From date</label>
                    <div>
                        <input 
                            type="date" 
                            value={startDateParam}
                            onChange={(e) => updateURLParams({ start_date: e.target.value, page: 1 })}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">To date</label>
                    <div>
                        <input 
                            type="date" 
                            value={endDateParam}
                            onChange={(e) => updateURLParams({ end_date: e.target.value, page: 1 })}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
                
                <button 
                    onClick={() => setSearchParams({})} 
                    className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                    Clear filters
                </button>
            </div>

            {/* Bảng Dữ Liệu */}
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Code / time</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Warehouse</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Items</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">
                                        No transactions match the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map(tx => {
                                    const wName = warehouses.find(w => w.id === tx.warehouse_id)?.name || `Warehouse #${tx.warehouse_id}`;
                                    const isIn = tx.transaction_type === 'IN';
                                    
                                    return (
                                        <tr key={tx.id} className="hover:bg-gray-50/50">
                                            {/* Mã phiếu & Thời gian */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900">{tx.code}</div>
                                                <div className="text-xs text-gray-500 mt-1">{new Date(tx.created_at).toLocaleString('vi-VN')}</div>
                                            </td>
                                            
                                            {/* Trạng thái & Loại */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold mb-1 ${
                                                    isIn ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
                                                }`}>
                                                    {isIn ? 'INBOUND' : 'OUTBOUND'}
                                                </div>
                                                <div>{getStatusBadge(tx.status)}</div>
                                            </td>
                                            
                                            {/* Kho (Nút bấm) */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button 
                                                    onClick={() => handleViewWarehouse(tx.warehouse_id)}
                                                    disabled={isLoadingWarehouse}
                                                    className="text-blue-600 hover:text-blue-800 hover:underline transition-colors text-left disabled:opacity-50"
                                                >
                                                    {wName}
                                                </button>
                                            </td>
                                            
                                            {/* Chi tiết mặt hàng */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-2 max-w-md">
                                                    {tx.details?.map(detail => (
                                                        <span key={detail.id} className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 shadow-sm">
                                                            <button 
                                                                onClick={() => handleViewProduct(detail.product_id || detail.product?.id)}
                                                                className="hover:text-indigo-600 hover:underline text-left mr-1 transition-colors"
                                                            >
                                                                {detail.product?.name || `SP #${detail.product_id}`}
                                                            </button>
                                                            <span className="font-bold text-indigo-600 ml-1">x{detail.quantity}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                                {tx.cancellation_reason && (
                                                    <div className="mt-2 text-xs text-red-600 flex items-center bg-red-50 p-1.5 rounded border border-red-100 w-fit">
                                                        Cancellation reason: {tx.cancellation_reason}
                                                    </div>
                                                )}
                                            </td>
                                            
                                            {/* Hành động */}
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <div className="flex justify-center gap-2">
                                                    {tx.status === 'DRAFT' && (
                                                        <>
                                                            <button 
                                                                onClick={() => handleApprove(tx.id)}
                                                                title="Approve and update inventory"
                                                                className="text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 text-xs rounded-md transition-colors shadow-sm"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button 
                                                                onClick={() => handleCancel(tx.id)}
                                                                title="Cancel draft transaction"
                                                                className="text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 text-xs rounded-md transition-colors shadow-sm"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </>
                                                    )}
                                                    {tx.status === 'APPROVED' && (
                                                        <button 
                                                            onClick={() => handleCancel(tx.id)}
                                                            title="Cancel approved transaction"
                                                            className="text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-md transition-colors flex items-center text-xs"
                                                        >
                                                            Cancel transaction
                                                        </button>
                                                    )}
                                                    {tx.status === 'CANCELED' && (
                                                        <span className="text-gray-400 text-xs italic bg-gray-100 px-2 py-1 rounded border border-gray-200">Closed</span>
                                                    )}
                                                </div>
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
                            Page <span className="font-medium">{page}</span> / <span className="font-medium">{totalPages}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => updateURLParams({ page: Math.max(1, page - 1) })}
                                disabled={page === 1}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                            >
                                Previous
                            </button>
                            <button 
                                onClick={() => updateURLParams({ page: Math.min(totalPages, page + 1) })}
                                disabled={page === totalPages}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- MODAL CHI TIẾT KHO --- */}
            {isWarehouseDetailOpen && warehouseDetail && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-4xl relative max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <button onClick={() => setIsWarehouseDetailOpen(false)} className="absolute top-4 right-4 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                            Close
                        </button>
                        
                        <div className="mb-4 border-b pb-4 shrink-0 pr-8">
                            <h3 className="text-2xl font-bold text-gray-800">{warehouseDetail.name}</h3>
                            <div className="flex gap-2 mt-2">
                                <span className={`px-2 py-1 text-xs font-semibold rounded ${warehouseDetail.warehouse_type === 'CENTRAL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {warehouseDetail.warehouse_type === 'CENTRAL' ? 'Central' : 'Branch'}
                                </span>
                                <span className={`px-2 py-1 text-xs font-semibold rounded ${warehouseDetail.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {warehouseDetail.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>

                        <div className="overflow-y-auto pr-2 grid grid-cols-1 lg:grid-cols-3 gap-6 text-sm text-gray-700">
                            {/* Cột trái */}
                            <div className="lg:col-span-1 space-y-6">
                                <div>
                                    <h4 className="font-bold text-lg mb-3 text-gray-800">Warehouse structure</h4>
                                    {warehouseDetail.warehouse_type === 'BRANCH' && (
                                        <p className="bg-gray-50 p-3 rounded border border-gray-100">
                                            <span className="font-medium">Parent warehouse: </span><br/>
                                            <span className="text-blue-600 font-semibold">{warehouseDetail.parent?.name || `ID #${warehouseDetail.parent_id}`}</span>
                                        </p>
                                    )}
                                    {warehouseDetail.warehouse_type === 'CENTRAL' && (
                                        <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                            <p className="font-medium mb-2">Branches ({warehouseDetail.branches?.length || 0})</p>
                                            <ul className="space-y-1">
                                                {warehouseDetail.branches?.length > 0 
                                                    ? warehouseDetail.branches.map(b => (
                                                        <li key={b.id} className="text-gray-700 flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span> 
                                                            {b.name} {!b.is_active && <span className="text-red-500 text-xs">(Inactive)</span>}
                                                        </li>
                                                    ))
                                                    : <li className="text-gray-500 italic">No branches available</li>
                                                }
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg mb-3 text-gray-800">Staff ({warehouseDetail.users?.length || 0})</h4>
                                    <ul className="space-y-2 max-h-64 overflow-y-auto">
                                        {warehouseDetail.users?.length > 0 ? warehouseDetail.users.map(u => (
                                            <li key={u.id} className="bg-gray-50 p-3 rounded border border-gray-100 flex flex-col">
                                                <span className="font-semibold text-gray-800">{u.full_name || 'Name not available'}</span>
                                                <span className="text-gray-500 text-xs mt-1">{u.email || 'No email available'}</span>
                                            </li>
                                        )) : <li className="text-gray-500 italic">No staff assigned</li>}
                                    </ul>
                                </div>
                            </div>
                            
                            {/* Cột phải */}
                            <div className="lg:col-span-2">
                                <h4 className="font-bold text-lg mb-3 text-gray-800">Inventory at this warehouse ({warehouseDetail.stocks?.length || 0} items)</h4>
                                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[400px] flex flex-col">
                                    <div className="overflow-y-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-100 text-gray-700 sticky top-0 shadow-sm">
                                                <tr>
                                                    <th className="p-3 font-semibold">SKU</th>
                                                    <th className="p-3 font-semibold">Product name</th>
                                                    <th className="p-3 font-semibold text-right">Quantity</th>
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
                                                        <td colSpan="3" className="p-8 text-center text-gray-500 bg-white">This warehouse is currently empty.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t flex justify-end shrink-0">
                            <button onClick={() => setIsWarehouseDetailOpen(false)} className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL CHI TIẾT SẢN PHẨM --- */}
            {isProductDetailOpen && productDetail && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
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
                                    {/* Khối Mô tả */}
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <span className="font-semibold block mb-2 text-gray-800">Description</span>
                                        <p className="text-gray-600 whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                                            {productDetail.description || <span className="italic text-gray-400">No description available.</span>}
                                        </p>
                                    </div>
                                    
                                    {/* Khối Thuộc tính */}
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

                                    {/* Ngày tạo */}
                                    <div className="flex justify-between pt-2 px-1">
                                        <span className="font-semibold text-gray-500">Created on</span>
                                        <span className="text-gray-800 font-medium">{formatDate(productDetail.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200 mt-auto">
                            <button onClick={() => setIsProductDetailOpen(false)} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors shadow-sm font-medium">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transactions;
