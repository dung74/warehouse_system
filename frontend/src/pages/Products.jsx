import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { productService } from "../services/productService";
import { uploadService } from "../services/uploadService";
import { categoryService } from "../services/categoryService";

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL;

const Products = () => {
    // --- LẤY ROLE TỪ LOCAL STORAGE ---
    const userRole = localStorage.getItem('user_role');
    const isAdmin = userRole === '1';

    const [searchParams, setSearchParams] = useSearchParams();

    // Lấy giá trị từ URL hoặc gán mặc định
    const initialPage = Number(searchParams.get("page")) || 1;
    const initialName = searchParams.get("name") || "";
    const initialCategoryId = searchParams.get("category_id") || "";
    const initialIsActive = searchParams.get("is_active") !== null ? searchParams.get("is_active") : "true";

    const [currentPage, setCurrentPage] = useState(initialPage);
    const [searchName, setSearchName] = useState(initialName);
    const [filterCategoryId, setFilterCategoryId] = useState(initialCategoryId);
    const [filterIsActive, setFilterIsActive] = useState(initialIsActive);

    const [searchInput, setSearchInput] = useState(initialName);

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // --- STATE CHO FORM ---
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        sku: "", name: "", category_id: "", base_price: "", description: "", image_path: ""
    });
    const [attributeRows, setAttributeRows] = useState([]);
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // --- STATE CHO MODAL CHI TIẾT ---
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 10;

    // 1. ĐỒNG BỘ TRẠNG THÁI LÊN URL
    useEffect(() => {
        const params = {};
        if (currentPage > 1) params.page = currentPage;
        if (searchName) params.name = searchName;
        if (filterCategoryId) params.category_id = filterCategoryId;
        if (filterIsActive !== "true") params.is_active = filterIsActive;
        
        setSearchParams(params, { replace: true });
    }, [currentPage, searchName, filterCategoryId, filterIsActive, setSearchParams]);

    // 2. FETCH DATA
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
                setFormData((prevData) => ({ ...prevData, category_id: categoryData[0].id }));
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
        setIsFormOpen(false);
    };

    const clearFilters = () => {
        setSearchInput(""); setSearchName(""); setFilterCategoryId(""); setFilterIsActive("true");
        setCurrentPage(1); setSearchParams({}); 
    };

    // --- CÁC HÀM XỬ LÝ FORM & ẢNH ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImageFile(file);
            setImagePreview(URL.createObjectURL(file)); 
        }
    };

    const handleAddAttributeRow = () => setAttributeRows([...attributeRows, { key: "", value: "" }]);
    const handleRemoveAttributeRow = (index) => {
        const newRows = [...attributeRows]; newRows.splice(index, 1); setAttributeRows(newRows);
    };
    const handleAttributeChange = (index, field, val) => {
        const newRows = [...attributeRows]; newRows[index][field] = val; setAttributeRows(newRows);
    };

    const resetForm = () => {
        setFormData({ 
            sku: "", name: "", 
            category_id: categories.length > 0 ? categories[0].id : "", 
            base_price: "", description: "", image_path: "" 
        });
        setAttributeRows([]);
        setSelectedImageFile(null);
        setImagePreview(null);
        setEditingId(null);
        setIsFormOpen(false);
    };

    const handleEditClick = (product) => {
        if (!isAdmin) return;
        setFormData({ 
            sku: product.sku, name: product.name, 
            category_id: product.category_id, base_price: product.base_price,
            description: product.description || "", image_path: product.image_path || ""
        });
        
        if (product.image_path) {
            setImagePreview(`${IMAGE_BASE_URL}${product.image_path}`);
        } else {
            setImagePreview(null);
        }

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
        if (!isAdmin) return;

        const parsedAttributes = {};
        attributeRows.forEach(row => {
            if (row.key.trim() !== "") parsedAttributes[row.key.trim()] = row.value.trim();
        });

        setLoading(true);
        try {
            let finalImagePath = formData.image_path;

            if (selectedImageFile) {
                const uploadRes = await uploadService.uploadFile(selectedImageFile);
                finalImagePath = uploadRes.image_path; 
            }

            const payload = { 
                ...formData, 
                category_id: Number(formData.category_id), 
                base_price: Number(formData.base_price), 
                attributes: parsedAttributes,
                image_path: finalImagePath
            };

            if (editingId) await productService.update(editingId, payload);
            else await productService.create(payload);
            
            resetForm(); 
            if (!editingId && filterIsActive !== 'true') setFilterIsActive('true');
            else fetchData(); 

        } catch (error) {
            alert(error.response?.data?.detail || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    // --- CÁC HÀM XEM CHI TIẾT & XÓA & KHÔI PHỤC ---
    const handleViewDetail = async (id) => {
        try {
            const data = await productService.getDetail(id);
            setSelectedProduct(data);
            setIsDetailOpen(true);
        } catch (error) {
            alert("Unable to load product details.");
        }
    };

    const handleDelete = async (id) => {
        if (!isAdmin) return;
        if (!window.confirm("Are you sure you want to move this product to the trash?")) return;
        try {
            await productService.delete(id); 
            if (products.length === 1 && currentPage > 1) setCurrentPage(prev => prev - 1);
            else fetchData();
        } catch (error) { alert(error.response?.data?.detail || "Unable to delete product."); }
    };

    const handleRestore = async (id) => {
        if (!isAdmin) return;
        if (!window.confirm("Restore this product to make it available again?")) return;
        try {
            await productService.restore(id); 
            if (products.length === 1 && currentPage > 1) setCurrentPage(prev => prev - 1);
            else fetchData();
        } catch (error) { alert(error.response?.data?.detail || "Unable to restore product."); }
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    const formatDate = (dateString) => {
        if (!dateString) return "Not available";
        return new Date(dateString).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const inputClass = "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm transition-colors mt-1 bg-white";

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen relative animate-fade-in">
            
            <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h2>
                </div>
                {/* CHỈ HIỂN THỊ NÚT THÊM NẾU LÀ ADMIN */}
                {isAdmin && (
                    <div className="mt-4 sm:mt-0">
                        <button 
                            onClick={() => {
                                if (!isFormOpen && filterIsActive !== 'true') setFilterIsActive('true'); 
                                isFormOpen ? resetForm() : setIsFormOpen(true);
                            }} 
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                        >
                            {isFormOpen ? 'Cancel' : 'Add product'}
                        </button>
                    </div>
                )}
            </div>

            {/* BỘ LỌC VÀ TÌM KIẾM */}
            <div className="bg-white p-4 shadow-sm ring-1 ring-gray-900/5 rounded-xl mb-6">
                <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <input type="text" placeholder="Search by product name" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-48">
                            <select value={filterCategoryId} onChange={handleCategoryFilterChange} className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white">
                                <option value="">All categories</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="w-full sm:w-48">
                            <select value={filterIsActive} onChange={handleStatusFilterChange} className={`block w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${filterIsActive === 'false' ? 'border-red-300 text-red-700 focus:ring-red-500 focus:border-red-500 bg-red-50' : 'border-gray-300 text-gray-700 focus:ring-blue-500 focus:border-blue-500 bg-white'}`}>
                                <option value="true">Active</option>
                                <option value="false">Trashed</option>
                                <option value="">All products</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="px-5 py-2 bg-gray-100 text-gray-700 font-medium text-sm rounded-lg hover:bg-gray-200 border border-gray-300 transition-colors">Search</button>
                        {(searchName || filterCategoryId || filterIsActive !== 'true') && (
                            <button type="button" onClick={clearFilters} className="px-4 py-2 text-red-600 font-medium text-sm rounded-lg hover:bg-red-50 transition-colors">Clear filters</button>
                        )}
                    </div>
                </form>
            </div>
            
            {/* THÊM SỬA SẢN PHẨM (CHỈ DÀNH CHO ADMIN) */}
            {isAdmin && isFormOpen && (
                <div className="bg-white p-6 shadow-sm ring-1 ring-gray-900/5 rounded-xl mb-8 border-t-4 border-blue-500 animate-fade-in-up">
                    <div className="border-b border-gray-100 pb-4 mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">{editingId ? `Update product: ${formData.sku}` : 'Add product'}</h3>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">SKU</label>
                                <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} required placeholder="Example: PRD-001" className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Product name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <select name="category_id" value={formData.category_id} onChange={handleInputChange} required className={inputClass}>
                                    <option value="" disabled>Select a category</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Base price (VND)</label>
                                <input type="number" name="base_price" value={formData.base_price} onChange={handleInputChange} required className={inputClass} />
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" placeholder="Enter a detailed description" className={`${inputClass} resize-none`}></textarea>
                            </div>
                        </div>

                        <div className="md:col-span-4 flex flex-col gap-2">
                            <label className="block text-sm font-medium text-gray-700">Product image</label>
                            <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 overflow-hidden relative min-h-[160px] p-2">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="object-contain w-full h-40 rounded" />
                                ) : (
                                    <div className="text-gray-400 flex flex-col items-center">
                                        <span className="text-xs">No image selected</span>
                                    </div>
                                )}
                            </div>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageChange} 
                                className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all mt-1"
                            />
                        </div>

                        <div className="md:col-span-12 bg-gray-50/50 p-4 rounded-lg border border-gray-100 mt-2">
                            <label className="block text-sm font-medium text-gray-800 mb-3">Additional attributes</label>
                            <div className="space-y-3">
                                {attributeRows.map((row, index) => (
                                    <div key={index} className="flex gap-3 items-start">
                                        <div className="w-1/3">
                                            <input type="text" placeholder="Name" value={row.key} onChange={(e) => handleAttributeChange(index, 'key', e.target.value)} className={`w-full ${inputClass}`} />
                                        </div>
                                        <div className="flex-1">
                                            <input type="text" placeholder="Value" value={row.value} onChange={(e) => handleAttributeChange(index, 'value', e.target.value)} className={`w-full ${inputClass}`} />
                                        </div>
                                        <button type="button" onClick={() => handleRemoveAttributeRow(index)} className="p-2 mt-1 shrink-0 text-red-500 hover:bg-red-50 rounded-md">
                                            Remove
                                        </button>
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddAttributeRow} className="mt-2 inline-flex items-center px-3 py-1.5 border border-dashed border-gray-300 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50">
                                    Add attribute
                                </button>
                            </div>
                        </div>

                        <div className="md:col-span-12 flex justify-end gap-3 pt-2">
                            <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button type="submit" disabled={loading} className={`inline-flex items-center px-6 py-2 rounded-lg text-white text-sm font-medium ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                {loading ? 'Saving...' : (editingId ? 'Update product' : 'Save product')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* BẢNG DANH SÁCH */}
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Image</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">SKU</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                                {/* <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Attributes</th> */}
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {products.length > 0 ? (
                                products.map((product) => {
                                    const cat = categories.find(c => c.id === product.category_id);
                                    // let attrObj = {};
                                    // try { attrObj = typeof product.attributes === 'string' ? JSON.parse(product.attributes) : (product.attributes || {}); } catch(e) {}

                                    return (
                                        <tr key={product.id} className={`hover:bg-gray-50/50 ${!product.is_active ? 'bg-red-50/30 opacity-70' : ''}`}>
                                            
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {product.image_path ? (
                                                    <img src={`${IMAGE_BASE_URL}${product.image_path}`} alt={product.name} className="h-10 w-10 rounded-md object-cover border border-gray-200" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-400">
                                                        <span className="text-xs">No image</span>
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {product.sku} 
                                                {!product.is_active && <span className="ml-2 text-xs text-red-500 bg-red-100 px-1.5 py-0.5 rounded">Trashed</span>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700 font-medium">{product.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                    {cat ? cat.name : `ID: ${product.category_id}`}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">{formatPrice(product.base_price)}</td>
                                            {/* <td className="px-6 py-4 text-sm max-w-xs">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {Object.entries(attrObj).length > 0 ? (
                                                        Object.entries(attrObj).map(([key, value], idx) => (
                                                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 border border-gray-200">
                                                                <span className="font-medium mr-1">{key}:</span> {value}
                                                            </span>
                                                        ))
                                                    ) : <span className="text-gray-400 italic text-xs">-</span>}
                                                </div>
                                            </td> */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                
                                                {/* Nút Xem Chi tiết (Cho phép mọi role truy cập) */}
                                                <button onClick={() => handleViewDetail(product.id)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md mr-2 transition-colors">
                                                    View
                                                </button>

                                                {/* Nút Sửa, Xóa, Khôi phục (CHỈ ADMIN) */}
                                                {isAdmin && (
                                                    product.is_active ? (
                                                        <>
                                                            <button onClick={() => handleEditClick(product)} className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md mr-2 transition-colors">
                                                                Edit
                                                            </button>
                                                            <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors">
                                                                Delete
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button onClick={() => handleRestore(product.id)} className="text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-md transition-colors">
                                                            Restore
                                                        </button>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <h3 className="text-sm font-medium text-gray-900">
                                                {filterIsActive === 'false' ? 'Trash is empty' : 'No products found'}
                                            </h3>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {totalItems > 0 && (
                   <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> of <span className="font-medium">{totalItems}</span>
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        Previous
                                    </button>
                                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300">
                                        Page {currentPage} / {totalPages}
                                    </span>
                                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        Next
                                    </button>
                                </nav>
                            </div>
                        </div>
                   </div>
                )}
            </div>

            {/* MODAL CHI TIẾT SẢN PHẨM */}
            {isDetailOpen && selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                        <button onClick={() => setIsDetailOpen(false)} className="absolute top-4 right-4 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-600 z-10 transition-colors">
                            Close
                        </button>

                        <div className="flex flex-col md:flex-row overflow-y-auto">
                            <div className="md:w-2/5 bg-gray-50 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-gray-200 min-h-[250px]">
                                {selectedProduct.image_path ? (
                                    <img src={`${IMAGE_BASE_URL}${selectedProduct.image_path}`} alt={selectedProduct.name} className="max-w-full max-h-[300px] rounded-lg shadow-sm object-contain" />
                                ) : (
                                    <div className="text-gray-400 text-center flex flex-col items-center">
                                        <p>No image available</p>
                                    </div>
                                )}
                            </div>

                            <div className="md:w-3/5 p-6 space-y-5">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedProduct.name}</h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">SKU: <span className="font-semibold text-gray-800">{selectedProduct.sku}</span></span>
                                        <span className={`text-xs px-2 py-1 rounded font-medium ${selectedProduct.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {selectedProduct.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-2xl font-bold text-blue-600">
                                    {formatPrice(selectedProduct.base_price)}
                                </div>

                                <div className="space-y-3 text-sm text-gray-700">
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <span className="font-semibold block mb-2 text-gray-800">Description</span>
                                        <p className="text-gray-600 whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                                            {selectedProduct.description || <span className="italic text-gray-400">No description available.</span>}
                                        </p>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <span className="font-semibold block mb-2 text-gray-800">Technical specifications</span>
                                        {selectedProduct.attributes && Object.keys(selectedProduct.attributes).length > 0 ? (
                                            <ul className="space-y-1">
                                                {Object.entries(selectedProduct.attributes).map(([k, v]) => (
                                                    <li key={k} className="flex border-b border-gray-200 pb-1 last:border-0 last:pb-0">
                                                        <span className="w-1/3 text-gray-500 font-medium">{k}:</span>
                                                        <span className="w-2/3 text-gray-800">{v}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="italic text-gray-400">No technical specifications available.</span>
                                        )}
                                    </div>

                                    <div className="flex justify-between pt-2 px-1">
                                        <span className="font-semibold text-gray-500">Created on</span>
                                        <span className="text-gray-800 font-medium">{formatDate(selectedProduct.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200 mt-auto">
                            <button onClick={() => setIsDetailOpen(false)} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors shadow-sm font-medium">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;