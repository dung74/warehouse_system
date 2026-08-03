import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { productService } from "../services/productService";
import { categoryService } from "../services/categoryService";
import { Plus, Trash2, PackageOpen, X, PlusCircle, ChevronLeft, ChevronRight, Edit, Search, RotateCcw } from "lucide-react";

const Products = () => {

    const [searchParams, setSearchParams] = useSearchParams();

    // Lấy giá trị từ URL hoặc gán mặc định
    const initialPage = Number(searchParams.get("page")) || 1;
    const initialName = searchParams.get("name") || "";
    const initialCategoryId = searchParams.get("category_id") || "";
    const initialIsActive = searchParams.get("is_active") !== null ? searchParams.get("is_active") : "true";

    const [currentPage, setCurrentPage] = useState(initialPage);
    const [searchName, setSearchName] = useState(initialName);
    const [filterCategoryId, setFilterCategoryId] = useState(initialCategoryId);
    const [filterIsActive, setFilterIsActive] = useState(initialIsActive); // State mới cho Soft Delete

    const [searchInput, setSearchInput] = useState(initialName);

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 10;

    const [formData, setFormData] = useState({
        sku: "", name: "", category_id: "", base_price: ""
    });

    const [attributeRows, setAttributeRows] = useState([]);

    // 1. ĐỒNG BỘ TRẠNG THÁI LÊN URL
    useEffect(() => {
        const params = {};
        if (currentPage > 1) params.page = currentPage;
        if (searchName) params.name = searchName;
        if (filterCategoryId) params.category_id = filterCategoryId;
        if (filterIsActive !== "true") params.is_active = filterIsActive; // Chỉ đưa lên URL nếu là xem thùng rác
        
        setSearchParams(params, { replace: true });
    }, [currentPage, searchName, filterCategoryId, filterIsActive, setSearchParams]);

    // 2. FETCH DATA KHI TRẠNG THÁI THAY ĐỔI
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, searchName, filterCategoryId, filterIsActive]);


    const fetchData = async () => {
        try {
            const apiParams = {
                page: currentPage,
                page_size: pageSize,
                name: searchName || undefined,
                category_id: filterCategoryId || undefined
            };

            // Xử lý cờ is_active cho backend
            if (filterIsActive !== "") {
                apiParams.is_active = filterIsActive === 'true';
            }

            const [productData, categoryData] = await Promise.all([
                productService.getAll(apiParams),
                categoryService.getAll()
            ]);

            setProducts(productData.items || []);
            setTotalPages(productData.total_pages || 1);
            setTotalItems(productData.total_items || 0); 
            setCategories(categoryData || []);

            if (categoryData.length > 0 && !formData.category_id && !editingId) {
                setFormData((prevData) => ({
                    ...prevData, 
                    category_id: categoryData[0].id
                }));
            }

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    // --- CÁC HÀM XỬ LÝ LỌC ---
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        setSearchName(searchInput);
    };

    const handleCategoryFilterChange = (e) => {
        setCurrentPage(1);
        setFilterCategoryId(e.target.value);
    };

    const handleStatusFilterChange = (e) => {
        setCurrentPage(1);
        setFilterIsActive(e.target.value);
        setIsFormOpen(false); // Ẩn form thêm mới nếu đang lướt xem thùng rác
    };

    const clearFilters = () => {
        setSearchInput(""); 
        setSearchName(""); 
        setFilterCategoryId(""); 
        setFilterIsActive("true");
        setCurrentPage(1);
        setSearchParams({}); 
    };

    // --- CÁC HÀM XỬ LÝ FORM ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddAttributeRow = () => setAttributeRows([...attributeRows, { key: "", value: "" }]);
    const handleRemoveAttributeRow = (index) => {
        const newRows = [...attributeRows];
        newRows.splice(index, 1);
        setAttributeRows(newRows);
    };
    const handleAttributeChange = (index, field, val) => {
        const newRows = [...attributeRows];
        newRows[index][field] = val;
        setAttributeRows(newRows);
    };

    const resetForm = () => {
        setFormData({ sku: "", name: "", category_id: categories.length > 0 ? categories[0].id : "", base_price: "" });
        setAttributeRows([]);
        setEditingId(null);
        setIsFormOpen(false);
    };

    const handleEditClick = (product) => {
        setFormData({ sku: product.sku, name: product.name, category_id: product.category_id, base_price: product.base_price });
        try {
            const attrs = typeof product.attributes === 'string' ? JSON.parse(product.attributes) : (product.attributes || {});
            setAttributeRows(Object.entries(attrs).map(([key, value]) => ({ key, value })));
        } catch (e) { setAttributeRows([]); }
        setEditingId(product.id);
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const parsedAttributes = {};
        attributeRows.forEach(row => {
            if (row.key.trim() !== "") parsedAttributes[row.key.trim()] = row.value.trim();
        });

        setLoading(true);
        try {
            const payload = { ...formData, category_id: Number(formData.category_id), base_price: Number(formData.base_price), attributes: parsedAttributes };
            if (editingId) await productService.update(editingId, payload);
            else await productService.create(payload);
            resetForm(); 
            // Nếu đang thêm mới mà màn hình đang ở Thùng rác thì chuyển về Đang bán
            if (!editingId && filterIsActive !== 'true') {
                setFilterIsActive('true');
            } else {
                fetchData(); 
            }
        } catch (error) {
            alert(error.response?.data?.detail || "Đã xảy ra lỗi.");
        } finally {
            setLoading(false);
        }
    };

    // --- XÓA & KHÔI PHỤC ---
    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn chuyển sản phẩm này vào thùng rác không?")) return;
        try {
            await productService.delete(id); // Giả sử API này là Soft Delete
            if (products.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            } else {
                fetchData();
            }
        } catch (error) { 
            alert(error.response?.data?.detail || "Lỗi khi xóa sản phẩm"); 
        }
    };

    const handleRestore = async (id) => {
        if (!window.confirm("Khôi phục lại sản phẩm này để tiếp tục kinh doanh?")) return;
        try {
            // Giả sử API của bạn là productService.restore(id) 
            // Nếu bạn dùng hàm update thì đổi thành: await productService.update(id, { is_active: true })
            await productService.restore(id); 
            
            if (products.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            } else {
                fetchData();
            }
            alert("Đã khôi phục sản phẩm thành công!");
        } catch (error) { 
            alert(error.response?.data?.detail || "Lỗi khi khôi phục sản phẩm"); 
        }
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    const inputClass = "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm transition-colors mt-1 bg-white";

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
            
            <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý Sản phẩm</h2>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button 
                        onClick={() => {
                            if (!isFormOpen && filterIsActive !== 'true') setFilterIsActive('true'); // Chuyển về Đang bán khi thêm mới
                            isFormOpen ? resetForm() : setIsFormOpen(true);
                        }} 
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm"
                    >
                        {isFormOpen ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                        {isFormOpen ? 'Hủy' : 'Thêm Sản phẩm'}
                    </button>
                </div>
            </div>

            {/* BỘ LỌC VÀ TÌM KIẾM */}
            <div className="bg-white p-4 shadow-sm ring-1 ring-gray-900/5 rounded-xl mb-6">
                <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-4">
                    {/* Tìm kiếm tên */}
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm theo tên sản phẩm..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Lọc danh mục */}
                        <div className="w-full sm:w-48">
                            <select 
                                value={filterCategoryId} 
                                onChange={handleCategoryFilterChange}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                                <option value="">Tất cả danh mục</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Lọc trạng thái (Đang bán / Đã xóa) */}
                        <div className="w-full sm:w-48">
                            <select 
                                value={filterIsActive} 
                                onChange={handleStatusFilterChange}
                                className={`block w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${
                                    filterIsActive === 'false' 
                                    ? 'border-red-300 text-red-700 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                                    : 'border-gray-300 text-gray-700 focus:ring-blue-500 focus:border-blue-500 bg-white'
                                }`}
                            >
                                <option value="true">🟢 Đang kinh doanh</option>
                                <option value="false">🔴 Đã vào thùng rác</option>
                                <option value="">⚪ Tất cả sản phẩm</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button type="submit" className="px-5 py-2 bg-gray-100 text-gray-700 font-medium text-sm rounded-lg hover:bg-gray-200 border border-gray-300 transition-colors">
                            Tìm kiếm
                        </button>
                        {(searchName || filterCategoryId || filterIsActive !== 'true') && (
                            <button 
                                type="button" 
                                onClick={clearFilters} 
                                className="px-4 py-2 text-red-600 font-medium text-sm rounded-lg hover:bg-red-50 transition-colors"
                            >
                                Xóa lọc
                            </button>
                        )}
                    </div>
                </form>
            </div>
            
            {/* Form Thêm/Sửa Sản Phẩm (Giữ nguyên như của bạn, không đổi) */}
            {isFormOpen && (
                <div className="bg-white p-6 shadow-sm ring-1 ring-gray-900/5 rounded-xl mb-8 border-t-4 border-blue-500">
                    {/* ... (Khối code form form giữ nguyên như của bạn) ... */}
                    <div className="border-b border-gray-100 pb-4 mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">{editingId ? `Cập nhật sản phẩm: ${formData.sku}` : 'Thêm sản phẩm mới'}</h3>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mã SKU</label>
                            <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} required placeholder="VD: SP-001" className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tên Sản phẩm</label>
                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Danh mục</label>
                            <select name="category_id" value={formData.category_id} onChange={handleInputChange} required className={inputClass}>
                                <option value="" disabled>-- Chọn Danh mục --</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Giá cơ bản (VNĐ)</label>
                            <input type="number" name="base_price" value={formData.base_price} onChange={handleInputChange} required className={inputClass} />
                        </div>
                        <div className="md:col-span-2 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                            <label className="block text-sm font-medium text-gray-800 mb-3">Thuộc tính mở rộng</label>
                            <div className="space-y-3">
                                {attributeRows.map((row, index) => (
                                    <div key={index} className="flex gap-3 items-start">
                                        <div className="w-1/3">
                                            <input type="text" placeholder="Tên" value={row.key} onChange={(e) => handleAttributeChange(index, 'key', e.target.value)} className={`w-full ${inputClass}`} />
                                        </div>
                                        <div className="flex-1">
                                            <input type="text" placeholder="Giá trị" value={row.value} onChange={(e) => handleAttributeChange(index, 'value', e.target.value)} className={`w-full ${inputClass}`} />
                                        </div>
                                        <button type="button" onClick={() => handleRemoveAttributeRow(index)} className="p-2 mt-1 shrink-0 text-red-500 hover:bg-red-50 rounded-md">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddAttributeRow} className="mt-2 inline-flex items-center px-3 py-1.5 border border-dashed border-gray-300 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50">
                                    <PlusCircle size={16} className="mr-1.5" /> Thêm thuộc tính
                                </button>
                            </div>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                            <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Hủy</button>
                            <button type="submit" disabled={loading} className={`inline-flex items-center px-6 py-2 rounded-lg text-white text-sm font-medium ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                {loading ? 'Đang xử lý...' : (editingId ? 'Cập nhật' : 'Lưu sản phẩm')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Bảng Danh sách Sản phẩm */}
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Mã SKU</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Tên SP</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Danh mục</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Giá bán</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Thuộc tính</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {products.length > 0 ? (
                                products.map((product) => {
                                    const cat = categories.find(c => c.id === product.category_id);
                                    let attrObj = {};
                                    try { attrObj = typeof product.attributes === 'string' ? JSON.parse(product.attributes) : (product.attributes || {}); } catch(e) {}

                                    return (
                                        <tr key={product.id} className={`hover:bg-gray-50/50 ${!product.is_active ? 'bg-red-50/30 opacity-70' : ''}`}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {product.sku} 
                                                {!product.is_active && <span className="ml-2 text-xs text-red-500 bg-red-100 px-1.5 py-0.5 rounded">Đã xóa</span>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700 font-medium">{product.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                    {cat ? cat.name : `ID: ${product.category_id}`}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">{formatPrice(product.base_price)}</td>
                                            <td className="px-6 py-4 text-sm max-w-xs">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {Object.entries(attrObj).length > 0 ? (
                                                        Object.entries(attrObj).map(([key, value], idx) => (
                                                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 border border-gray-200">
                                                                <span className="font-medium mr-1">{key}:</span> {value}
                                                            </span>
                                                        ))
                                                    ) : <span className="text-gray-400 italic text-xs">-</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {/* XỬ LÝ NÚT HIỂN THỊ THEO TRẠNG THÁI */}
                                                {product.is_active ? (
                                                    <>
                                                        <button onClick={() => handleEditClick(product)} className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md mr-2 transition-colors">
                                                            <Edit size={16} className="inline mr-1" /> Sửa
                                                        </button>
                                                        <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors">
                                                            <Trash2 size={16} className="inline mr-1" /> Xóa
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button onClick={() => handleRestore(product.id)} className="text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-md transition-colors">
                                                        <RotateCcw size={16} className="inline mr-1" /> Khôi phục
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-gray-100 p-3 rounded-full mb-4"><PackageOpen className="h-8 w-8 text-gray-400" /></div>
                                            <h3 className="text-sm font-medium text-gray-900">
                                                {filterIsActive === 'false' ? 'Thùng rác trống' : 'Không tìm thấy sản phẩm nào'}
                                            </h3>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {totalItems > 0 && (
                   <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Hiển thị từ <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> đến <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> trong tổng số <span className="font-medium">{totalItems}</span>
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300">
                                        Trang {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                   </div>
                )}
            </div>
        </div>
    );
};

export default Products;