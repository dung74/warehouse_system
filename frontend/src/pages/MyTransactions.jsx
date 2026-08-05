import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { transactionService } from '../services/transactionService';
import { productService } from '../services/productService';
import { userService } from '../services/userService'; 

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL;

const MyTransactions = () => {
    const user_id = parseInt(localStorage.getItem('user_id') || '0', 10);
    const currentWarehouseId = parseInt(localStorage.getItem('warehouse_id'), 10);

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

    const [transactions, setTransactions] = useState([]);
    const [totalRows, setTotalRows] = useState(0);

    const [formData, setFormData] = useState({
        transaction_type: 'IN',
    });
    const [selectedItems, setSelectedItems] = useState([]);

    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [productSuggestions, setProductSuggestions] = useState([]);
    const [isSearchingProduct, setIsSearchingProduct] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const dropdownRef = useRef(null);

    const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
    const [productDetail, setProductDetail] = useState(null);
    const [isLoadingProduct, setIsLoadingProduct] = useState(false);

    // --- STATES CHO MODAL CHI TIẾT NGƯỜI DÙNG ---
    const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
    const [userDetail, setUserDetail] = useState(null);
    const [isLoadingUser, setIsLoadingUser] = useState(false);

    useEffect(() => {
        fetchTransactions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

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

    const fetchTransactions = async () => {
        if (!currentWarehouseId || isNaN(currentWarehouseId)) return;

        try {
            const params = { 
                skip: (page - 1) * limit, 
                limit: limit,
                warehouse_id: currentWarehouseId 
            };
            
            if (statusParam) params.status = statusParam;
            if (startDateParam) params.start_date = `${startDateParam}T00:00:00`;
            if (endDateParam) params.end_date = `${endDateParam}T23:59:59`;

            const data = await transactionService.getAll(params);
            
            const strictMyTransactions = (data.items || []).filter(tx => tx.warehouse_id === currentWarehouseId);
            setTransactions(strictMyTransactions);
            setTotalRows(data.total || 0);

        } catch (error) {
            console.error("Lỗi tải giao dịch:", error);
        }
    };

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
        if (!currentWarehouseId) return alert("System error: Missing Warehouse ID.");
        if (selectedItems.length === 0) return alert("Please add at least one product to the transaction.");

        try {
            const payload = {
                warehouse_id: currentWarehouseId,
                // user_id: user_id,
                transaction_type: formData.transaction_type,
                details: selectedItems.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity
                }))
            };
            
            await transactionService.create(payload);
            alert("Draft transaction created successfully.");
            
            setFormData({ transaction_type: 'IN' });
            setSelectedItems([]);
            updateURLParams({ page: 1 }); 
            fetchTransactions();
        } catch (error) {
            alert(error.response?.data?.detail || "Unable to create draft transaction.");
        }
    };

    const handleApprove = async (transactionId, warehouseId) => {
        if(!window.confirm("Are you sure you want to approve this transaction? Inventory quantities will be updated.")) return;
        try {
            await transactionService.approve(transactionId, warehouseId);
            alert("Transaction approved and inventory updated successfully.");
            fetchTransactions();
        } catch (error) {
            alert(error.response?.data?.detail || "Unable to approve transaction.");
        }
    };

    const handleCancel = async (transactionId, warehouseId) => {
        const reason = window.prompt("Enter a reason for cancellation:");
        if (!reason) return; 

        try {
            await transactionService.cancel(transactionId, warehouseId, reason);
            alert("Transaction canceled successfully.");
            fetchTransactions();
        } catch (error) {
            alert(error.response?.data?.detail || "Unable to cancel transaction.");
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

    // --- HÀM XEM CHI TIẾT NGƯỜI DÙNG ---
    const handleViewUser = async (userId) => {
        if (!userId) return;
        setIsLoadingUser(true);
        try {
            const data = await userService.getUserDetail(userId);
            setUserDetail(data);
            setIsUserDetailOpen(true);
        } catch (error) {
            alert(error.response?.data?.detail || "Unable to load user details.");
        } finally {
            setIsLoadingUser(false);
        }
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    
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
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen relative animate-fade-in">
            <div className="mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">My Warehouse Transactions</h2>
                    <p className="mt-1 text-sm text-gray-500">Manage inbound and outbound inventory for your assigned workplace.</p>
                </div>
            </div>

            {/* === PHẦN 1: FORM TẠO PHIẾU NHÁP === */}
            <div className="bg-white p-6 shadow-sm ring-1 ring-gray-900/5 rounded-xl mb-8 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-3">Create draft transaction</h3>
                
                <form onSubmit={handleSubmitDraft} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="space-y-4 lg:col-span-1">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction type</label>
                            <select 
                                value={formData.transaction_type}
                                onChange={(e) => setFormData({...formData, transaction_type: e.target.value})}
                                className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium bg-gray-50"
                            >
                                <option value="IN">Inbound (Stock IN)</option>
                                <option value="OUT">Outbound (Stock OUT)</option>
                            </select>
                        </div>
                        
                        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 mt-4">
                            <div className="flex items-start">
                                <span className="text-blue-500 mr-2">ℹ️</span>
                                <div>
                                    <h4 className="text-sm font-semibold text-blue-800">Target Warehouse</h4>
                                    <p className="text-xs text-blue-600 mt-1">This transaction will be automatically recorded to your assigned warehouse (ID: {currentWarehouseId}).</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search & Add products</label>
                        <div className="relative" ref={dropdownRef}>
                            <div className="relative">
                                <input 
                                    type="text" placeholder="Type product name or SKU..." 
                                    value={productSearchTerm}
                                    onChange={(e) => setProductSearchTerm(e.target.value)}
                                    className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm focus:bg-white transition-colors"
                                    onFocus={() => { if(productSuggestions.length > 0) setShowSuggestions(true); }}
                                />
                            </div>

                            {showSuggestions && productSuggestions.length > 0 && (
                                <ul className="absolute z-10 mt-1 w-full bg-white shadow-xl max-h-60 rounded-lg py-1 text-sm ring-1 ring-black ring-opacity-5 overflow-auto border border-gray-100">
                                    {productSuggestions.map((product) => (
                                        <li 
                                            key={product.id}
                                            onClick={() => handleSelectProduct(product)}
                                            className="cursor-pointer select-none relative py-3 pl-4 pr-9 hover:bg-indigo-50 text-gray-900 flex justify-between border-b border-gray-50 last:border-0"
                                        >
                                            <span className="block font-medium truncate">{product.name}</span>
                                            <span className="block text-xs text-gray-500 ml-2 bg-gray-100 px-2 py-0.5 rounded">SKU: {product.sku}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {selectedItems.length > 0 ? (
                            <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product Details</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-32">Quantity</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-20">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {selectedItems.map((item) => (
                                            <tr key={item.product_id} className="hover:bg-gray-50/50">
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    <div className="font-medium">{item.name}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">SKU: {item.sku}</div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
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
                                                        className="w-20 text-center rounded-md border border-gray-300 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium bg-gray-50"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button type="button" onClick={() => handleRemoveItem(item.product_id)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="mt-3 p-6 bg-gray-50 border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400">
                                <span className="text-sm">No products selected. Search to add products to this transaction.</span>
                            </div>
                        )}

                        <div className="pt-2 flex justify-end">
                            <button 
                                type="submit" 
                                className="inline-flex items-center justify-center py-2.5 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                Save draft
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* === PHẦN 2: LỊCH SỬ PHIẾU KHO === */}
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction history</h3>
            
            <div className="bg-white p-4 shadow-sm ring-1 ring-gray-900/5 rounded-xl mb-6 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                    <select 
                        value={statusParam}
                        onChange={(e) => updateURLParams({ status: e.target.value, page: 1 })}
                        className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                        <option value="">All statuses</option>
                        <option value="DRAFT">Draft</option>
                        <option value="APPROVED">Approved</option>
                        <option value="CANCELED">Canceled</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">From date</label>
                    <input 
                        type="date" 
                        value={startDateParam}
                        onChange={(e) => updateURLParams({ start_date: e.target.value, page: 1 })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">To date</label>
                    <input 
                        type="date" 
                        value={endDateParam}
                        onChange={(e) => updateURLParams({ end_date: e.target.value, page: 1 })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    />
                </div>
                
                <button 
                    onClick={() => setSearchParams({})} 
                    className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
                >
                    Clear filters
                </button>
            </div>

            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase w-48">Code & Time</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase w-32">Type</th>
                                {/* THÊM CỘT CREATED BY Ở ĐÂY */}
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase w-40">Created By</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Product details</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase w-40">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16 text-center text-sm text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <span className="text-4xl mb-3">📭</span>
                                            <span>No transactions found for your warehouse.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                transactions.map(tx => {
                                    const isIn = tx.transaction_type === 'IN';
                                    
                                    return (
                                        <tr key={tx.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900 font-mono">{tx.code}</div>
                                                <div className="text-xs text-gray-500 mt-1">{new Date(tx.created_at).toLocaleString('vi-VN')}</div>
                                            </td>
                                            
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold mb-1.5 ${
                                                    isIn ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
                                                }`}>
                                                    {isIn ? 'INBOUND' : 'OUTBOUND'}
                                                </div>
                                                <div>{getStatusBadge(tx.status)}</div>
                                            </td>

                                            {/* --- THÊM Ô DỮ LIỆU CREATED BY --- */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleViewUser(tx.user_id)}
                                                    disabled={isLoadingUser}
                                                    className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline disabled:opacity-50 transition-colors text-left"
                                                >
                                                    <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs mr-2 shadow-sm font-bold border border-indigo-200">
                                                        {(tx.user?.full_name || tx.user?.username || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="truncate max-w-[120px]">
                                                        {tx.user?.full_name || tx.user?.username || `User #${tx.user_id}`}
                                                    </span>
                                                </button>
                                            </td>
                                            
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-2 max-w-lg">
                                                    {tx.details?.map(detail => (
                                                        <span key={detail.id} className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                                                            <button 
                                                                onClick={() => handleViewProduct(detail.product_id || detail.product?.id)}
                                                                className="hover:text-indigo-600 hover:underline text-left mr-1 transition-colors"
                                                            >
                                                                {detail.product?.name || `SP #${detail.product_id}`}
                                                            </button>
                                                            <span className="font-bold text-indigo-600 ml-1 bg-white px-1 rounded shadow-sm border border-gray-100">
                                                                x{detail.quantity}
                                                            </span>
                                                        </span>
                                                    ))}
                                                </div>
                                                {tx.cancellation_reason && (
                                                    <div className="mt-3 text-xs text-red-600 flex items-center bg-red-50/50 p-2 rounded-md border border-red-100/50 w-fit">
                                                        <span className="font-semibold mr-1">Reason:</span> {tx.cancellation_reason}
                                                    </div>
                                                )}
                                            </td>
                                            
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <div className="flex flex-col gap-2 items-center">
                                                    {tx.status === 'DRAFT' && (
                                                        <>
                                                            <button 
                                                                onClick={() => handleApprove(tx.id, tx.warehouse_id)}
                                                                className="w-full text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 text-xs rounded-md transition-colors shadow-sm font-semibold"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button 
                                                                onClick={() => handleCancel(tx.id, tx.warehouse_id)}
                                                                className="w-full text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 text-xs rounded-md transition-colors shadow-sm font-semibold"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </>
                                                    )}
                                                    {tx.status === 'APPROVED' && (
                                                        <button 
                                                            onClick={() => handleCancel(tx.id, tx.warehouse_id)}
                                                            className="w-full text-red-600 bg-white hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-md transition-colors text-xs font-semibold"
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

                {totalPages > 1 && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between rounded-b-xl gap-4">
                        <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{(page - 1) * limit + (transactions.length > 0 ? 1 : 0)}</span> to <span className="font-medium">{Math.min(page * limit, totalRows)}</span> of <span className="font-medium">{totalRows}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => updateURLParams({ page: Math.max(1, page - 1) })}
                                disabled={page === 1}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                            >
                                Prev
                            </button>
                            <span className="text-sm text-gray-600 px-2 font-medium">
                                {page} / {totalPages}
                            </span>
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

            {/* --- MODAL CHI TIẾT SẢN PHẨM --- */}
            {isProductDetailOpen && productDetail && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                        <button onClick={() => setIsProductDetailOpen(false)} className="absolute top-4 right-4 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-600 z-10 transition-colors">Close</button>
                        <div className="flex flex-col md:flex-row overflow-y-auto">
                            <div className="md:w-2/5 bg-gray-50 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-gray-200 min-h-[250px]">
                                {productDetail.image_path ? (
                                    <img src={`${IMAGE_BASE_URL}${productDetail.image_path}`} alt={productDetail.name} className="max-w-full max-h-[300px] rounded-lg shadow-sm object-contain" />
                                ) : (
                                    <div className="text-gray-400 text-center flex flex-col items-center">
                                        <p>No image available</p>
                                    </div>
                                )}
                            </div>
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
                                <div className="text-2xl font-bold text-blue-600">{formatPrice(productDetail.base_price || 0)}</div>
                                <div className="space-y-3 text-sm text-gray-700">
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <span className="font-semibold block mb-2 text-gray-800">Description</span>
                                        <p className="text-gray-600 whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                                            {productDetail.description || <span className="italic text-gray-400">No description available.</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL CHI TIẾT NGƯỜI DÙNG TẠO PHIẾU --- */}
            {isUserDetailOpen && userDetail && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        {/* Header của Modal User */}
                        <div className="bg-slate-900 p-6 text-white relative">
                            <button 
                                onClick={() => setIsUserDetailOpen(false)} 
                                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                            <div className="flex items-center gap-5">
                                <div className="h-16 w-16 bg-indigo-500 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-indigo-300 shadow-lg shrink-0">
                                    {(userDetail.full_name || userDetail.username || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold leading-tight">{userDetail.full_name || 'No Full Name Provided'}</h3>
                                    <p className="text-indigo-300 text-sm mt-1">@{userDetail.username}</p>
                                </div>
                            </div>
                        </div>

                        {/* Nội dung chi tiết */}
                        <div className="p-6 space-y-5 bg-gray-50">
                            <div className="grid grid-cols-2 gap-4 text-sm bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <div>
                                    <span className="text-gray-500 font-medium block mb-1">Email Address</span>
                                    <span className="font-semibold text-gray-900 truncate block" title={userDetail.email}>
                                        {userDetail.email || 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 font-medium block mb-1">Account Status</span>
                                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold border ${
                                        userDetail.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                        {userDetail.is_active ? 'Active User' : 'Inactive Account'}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-500 font-medium">Assigned Warehouse</span>
                                    <span className="font-semibold text-gray-900">
                                        {userDetail.warehouse?.name || (userDetail.warehouse_id ? `Warehouse ID: ${userDetail.warehouse_id}` : 'No warehouse')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 font-medium">System Role</span>
                                    <span className="font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">
                                        {userDetail.role?.name || (userDetail.role_id === 1 ? 'Admin' : 'Staff')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTransactions;