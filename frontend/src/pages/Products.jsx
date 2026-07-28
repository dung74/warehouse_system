import React, { useEffect, useState } from "react";
import { productService } from "../services/productService";
import { categoryService } from "../services/categoryService";


const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        sku: "",
        name: "",
        category_id: "",
        base_price: "",
        attributes: '{}'
    });

    useEffect(() =>{
        fetchData();
    }, []);

    const fetchData = async() => {
        try {
            const [productData, categoryData] = await Promise.all([
                productService.getAll(),
                categoryService.getAll()
            ]);
            setProducts(productData);
            setCategories(categoryData);

            if (categoryData.length > 0) {
                setFormData(prev => ({ ...prev, category_id: categoryData[0].id}));
            }
        } catch (error) {
            console.error("Error fetching products or categories:", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();

        let parseAttributes = {};
        try {
            parseAttributes = JSON.parse(formData.attributes);
        } catch (error) {
            alert("Attributes must be a valid JSON string.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                sku: formData.sku,
                name: formData.name,
                category_id: Number(formData.category_id),
                base_price: Number(formData.base_price),
                attributes: parseAttributes
            };

            await productService.create(payload);

            setFormData(prev => ({
                ...prev,
                sku: "",
                name: "",
                base_price: "",
                attributes: '{}'
            }));

            fetchData();
        } catch (error) {
            alert(error.response?.data?.detail || "Error adding product.");
        } finally{
            setLoading(false);
        }

    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;

        try {
            await productService.delete(id);
            fetchData();
        } catch (error) {
            console.error("Error when deleting product:", error);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Quản lý Sản phẩm</h2>
            
            {/* Form Thêm Sản Phẩm */}
            <form onSubmit={handleAddProduct} className="bg-white p-6 shadow-md rounded-lg mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* SKU */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} required className="w-full border border-gray-300 rounded px-3 py-2" />
                </div>

                {/* Tên sản phẩm */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên Sản phẩm</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full border border-gray-300 rounded px-3 py-2" />
                </div>

                {/* Danh mục */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                    <select name="category_id" value={formData.category_id} onChange={handleInputChange} required className="w-full border border-gray-300 rounded px-3 py-2">
                        <option value="">-- Chọn Danh mục --</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Giá cơ bản */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá cơ bản</label>
                    <input type="number" name="base_price" value={formData.base_price} onChange={handleInputChange} required className="w-full border border-gray-300 rounded px-3 py-2" />
                </div>

                {/* Thuộc tính mở rộng */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thuộc tính mở rộng (JSON format)</label>
                    <textarea 
                        name="attributes" 
                        value={formData.attributes} 
                        onChange={handleInputChange} 
                        rows="3" 
                        className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm"
                        placeholder='{"color": "red", "size": "XL"}'
                    ></textarea>
                </div>

                <div className="md:col-span-2 flex justify-end">
                    <button type="submit" disabled={loading} className={`px-6 py-2 rounded text-white font-medium ${loading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'}`}>
                        {loading ? 'Đang thêm...' : 'Thêm Sản phẩm'}
                    </button>
                </div>
            </form>

            {/* Bảng Danh sách Sản phẩm */}
            <div className="bg-white shadow rounded-lg overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên SP</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thuộc tính</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {products.map((product) => {
                            const cat = categories.find(c => c.id === product.category_id);
                            return (
                                <tr key={product.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{product.sku}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{cat ? cat.name : product.category_id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{product.base_price.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm font-mono text-gray-500 truncate max-w-xs">
                                        {JSON.stringify(product.attributes)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900 font-medium">Xóa</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {products.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                        Chưa có sản phẩm nào.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Products;
