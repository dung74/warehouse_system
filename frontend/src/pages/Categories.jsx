import React, { useState, useEffect } from "react";
import { categoryService } from "../services/categoryService";

const Categories = () => {
    const [categories, setCategories] = useState([]);

    const [newCategoryName, setNewCategoryName] = useState('');
    const [loading, setLoading] = useState(false);

    const userRole = localStorage.getItem('user_role');
    const isAdmin = userRole === '1'; // Assuming role_id 1 is for admin

    useEffect(() =>{
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const data = await categoryService.getAll();
            setCategories(data);
        } catch (error) {
            console.error("Error when fetching categories:", error);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        setLoading(true);
        try {
            await categoryService.create({ name: newCategoryName });
            setNewCategoryName('');
            fetchCategories();
        } catch (error) {
            alert(error.response?.data?.detail || "Error when adding category");

        } finally {
            setLoading(false);
        }

    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này không?")) return;

        try {
            await categoryService.delete(id);
            // Backend trả về HTTP_204_NO_CONTENT nên thành công sẽ lọt vào đây
            alert("Xóa danh mục thành công!");
            fetchCategories(); // Làm mới lại bảng
            
        } catch (error) {
            console.error("Error when deleting category:", error);
            
            // Xử lý các mã lỗi cụ thể từ Backend
            if (error.response) {
                const status = error.response.status;
                const detail = error.response.data?.detail;

                if (status === 400) {
                    alert("Không thể xóa danh mục này vì nó đang chứa sản phẩm!");
                } else if (status === 403) {
                    alert( "Bạn không có quyền Admin để thực hiện thao tác này!");
                } else if (status === 404) {
                    alert( "Không tìm thấy danh mục (có thể đã bị xóa trước đó).");
                    fetchCategories(); // Làm mới lại bảng vì dữ liệu Frontend đang bị cũ
                } else {
                    alert(`Đã xảy ra lỗi: ${detail || "Vui lòng thử lại sau."}`);
                }
            } else {
                // Lỗi khi server sập hoặc mất kết nối mạng
                alert("Lỗi kết nối đến máy chủ. Vui lòng kiểm tra lại mạng!");
            }
        }
    };
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Quản lý Danh mục (Categories)</h2>

            {/* Form thêm mới */}
            <form onSubmit={handleAddCategory} className="flex gap-3 mb-6">
                <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nhập tên danh mục mới..." 
                    className="border border-gray-300 p-2 rounded flex-1 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                >
                    {loading ? 'Đang thêm...' : 'Thêm mới'}
                </button>
            </form>

            {/* Bảng danh sách */}
            <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
                <table className="min-w-full border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tên danh mục
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {categories.map((category) => (
                            <tr key={category.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {category.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {category.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                    {isAdmin && (
                                        <button onClick={() => handleDelete(category.id)} className="text-red-500">
                                            Xóa
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        
                        {/* Hiển thị khi mảng trống */}
                        {categories.length === 0 && (
                            <tr>
                                <td colSpan="3" className="px-6 py-8 text-center text-gray-500 text-sm">
                                    Chưa có danh mục nào.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

};

export default Categories;