import React, { useEffect, useState } from "react";
import { productService } from "../services/productService";
import { categoryService } from "../services/categoryService";
import { Plus, Trash2, PackageOpen, X, PlusCircle } from "lucide-react"; 

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // State cho các trường thông tin cơ bản
    const [formData, setFormData] = useState({
        sku: "",
        name: "",
        category_id: "",
        base_price: ""
    });

    // Tách riêng state để quản lý mảng các thuộc tính động
    const [attributeRows, setAttributeRows] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [productData, categoryData] = await Promise.all([
                productService.getAll(),
                categoryService.getAll()
            ]);
            setProducts(productData);
            setCategories(categoryData);

            if (categoryData.length > 0) {
                setFormData(prev => ({ ...prev, category_id: categoryData[0].id }));
            }
        } catch (error) {
            console.error("Error fetching products or categories:", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- CÁC HÀM XỬ LÝ THUỘC TÍNH ĐỘNG ---
    const handleAddAttributeRow = () => {
        setAttributeRows([...attributeRows, { key: "", value: "" }]);
    };

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
    // -------------------------------------

    const handleAddProduct = async (e) => {
        e.preventDefault();

        // Tự động gom mảng attributeRows thành 1 object JSON hoàn chỉnh
        const parsedAttributes = {};
        attributeRows.forEach(row => {
            const cleanKey = row.key.trim();
            const cleanValue = row.value.trim();
            if (cleanKey !== "") {
                parsedAttributes[cleanKey] = cleanValue;
            }
        });

        setLoading(true);
        try {
            const payload = {
                sku: formData.sku,
                name: formData.name,
                category_id: Number(formData.category_id),
                base_price: Number(formData.base_price),
                attributes: parsedAttributes // Truyền object đã gom vào đây
            };

            await productService.create(payload);

            // Reset form sau khi thành công
            setFormData(prev => ({
                ...prev,
                sku: "",
                name: "",
                base_price: ""
            }));
            setAttributeRows([]); // Reset lại list thuộc tính
            
            setIsFormOpen(false); 
            fetchData();
        } catch (error) {
            alert(error.response?.data?.detail || "Lỗi khi thêm sản phẩm.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) return;

        try {
            await productService.delete(id);
            fetchData();
        } catch (error) {
            console.error("Error when deleting product:", error);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const inputClass = "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm transition-colors mt-1";

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
            
            {/* Header Section */}
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý Sản phẩm</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Thêm mới, chỉnh sửa và quản lý toàn bộ danh sách sản phẩm.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button 
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all"
                    >
                        {isFormOpen ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                        {isFormOpen ? 'Hủy thêm mới' : 'Thêm Sản phẩm'}
                    </button>
                </div>
            </div>
            
            {/* Form Thêm Sản Phẩm */}
            {isFormOpen && (
                <div className="bg-white p-6 shadow-sm ring-1 ring-gray-900/5 rounded-xl mb-8 transition-all duration-300 ease-in-out">
                    <div className="border-b border-gray-100 pb-4 mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Thông tin sản phẩm mới</h3>
                    </div>
                    <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mã SKU</label>
                            <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} required placeholder="VD: SP-001" className={inputClass} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tên Sản phẩm</label>
                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Nhập tên sản phẩm..." className={inputClass} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Danh mục</label>
                            <select name="category_id" value={formData.category_id} onChange={handleInputChange} required className={inputClass}>
                                <option value="" disabled>-- Chọn Danh mục --</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Giá cơ bản (VNĐ)</label>
                            <input type="number" name="base_price" value={formData.base_price} onChange={handleInputChange} required placeholder="0" min="0" className={inputClass} />
                        </div>

                        {/* Phần quản lý thuộc tính động */}
                        <div className="md:col-span-2 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-sm font-medium text-gray-800">
                                    Thuộc tính mở rộng <span className="text-gray-500 font-normal">(Kích thước, Màu sắc, Chất liệu, v.v...)</span>
                                </label>
                            </div>
                            
                            <div className="space-y-3">
                                {attributeRows.map((row, index) => (
                                    <div key={index} className="flex flex-wrap sm:flex-nowrap gap-3 items-start">
                                        <div className="w-full sm:w-1/3">
                                            <input
                                                type="text"
                                                placeholder="Tên thuộc tính (VD: Màu sắc)"
                                                value={row.key}
                                                onChange={(e) => handleAttributeChange(index, 'key', e.target.value)}
                                                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                                            />
                                        </div>
                                        <div className="w-full sm:flex-1">
                                            <input
                                                type="text"
                                                placeholder="Giá trị (VD: Đỏ, Xanh, Vàng...)"
                                                value={row.value}
                                                onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                                                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAttributeRow(index)}
                                            className="p-2 mt-1 sm:mt-0 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
                                            title="Xóa thuộc tính này"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                                
                                <button
                                    type="button"
                                    onClick={handleAddAttributeRow}
                                    className="mt-2 inline-flex items-center px-3 py-1.5 border border-dashed border-gray-300 rounded-md text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all"
                                >
                                    <PlusCircle size={16} className="mr-1.5" /> Thêm thuộc tính
                                </button>
                            </div>
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                            <button 
                                type="button" 
                                onClick={() => setIsFormOpen(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button 
                                type="submit" 
                                disabled={loading} 
                                className={`inline-flex items-center px-6 py-2 rounded-lg text-white text-sm font-medium transition-colors ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-sm'}`}
                            >
                                {loading ? 'Đang xử lý...' : 'Lưu sản phẩm'}
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
                                    
                                    // Parse thuộc tính để render giao diện
                                    let attrObj = {};
                                    try {
                                        // Nếu API trả về chuỗi JSON thì parse, nếu đã là Object thì dùng luôn
                                        attrObj = typeof product.attributes === 'string' 
                                            ? JSON.parse(product.attributes) 
                                            : (product.attributes || {});
                                    } catch(e) { console.error(e); }

                                    return (
                                        <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.sku}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700 font-medium">{product.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                    {cat ? cat.name : `ID: ${product.category_id}`}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                                                {formatPrice(product.base_price)}
                                            </td>
                                            <td className="px-6 py-4 text-sm max-w-xs">
                                                {/* HIỂN THỊ THUỘC TÍNH RÕ RÀNG */}
                                                <div className="flex flex-wrap gap-1.5">
                                                    {Object.entries(attrObj).length > 0 ? (
                                                        Object.entries(attrObj).map(([key, value], idx) => (
                                                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800 border border-gray-200">
                                                                <span className="font-medium mr-1">{key}:</span> {value}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-gray-400 italic text-xs">Không có</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleDelete(product.id)} className="inline-flex items-center text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors">
                                                    <Trash2 size={16} className="mr-1.5" /> Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-gray-100 p-3 rounded-full mb-4"><PackageOpen className="h-8 w-8 text-gray-400" /></div>
                                            <h3 className="text-sm font-medium text-gray-900">Không có sản phẩm nào</h3>
                                            <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách thêm sản phẩm đầu tiên của bạn.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Products;