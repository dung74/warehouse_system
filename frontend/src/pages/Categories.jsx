import React, { useState, useEffect } from "react";
import { categoryService } from "../services/categoryService";

const Categories = () => {
    const [categories, setCategories] = useState([]);

    const [newCategoryName, setNewCategoryName] = useState('');
    const [loading, setLoading] = useState(false);

    const userRole = localStorage.getItem('user_role');
    const isAdmin = userRole === '1';

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
        if (!window.confirm("Are you sure you want to delete this category?")) return;

        try {
            await categoryService.delete(id);
            alert("Category deleted successfully.");
            fetchCategories();
            
        } catch (error) {
            console.error("Error when deleting category:", error);
            
            if (error.response) {
                const status = error.response.status;
                const detail = error.response.data?.detail;

                if (status === 400) {
                    alert("This category cannot be deleted because it contains products.");
                } else if (status === 403) {
                    alert("You do not have administrator permission for this action.");
                } else if (status === 404) {
                    alert("Category not found. It may have already been deleted.");
                    fetchCategories();
                } else {
                    alert(`An error occurred: ${detail || "Please try again later."}`);
                }
            } else {
                alert("Unable to connect to the server. Please check your network.");
            }
        }
    };
    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Categories</h2>
                <p className="mt-1 text-sm text-gray-500">Organize the product catalog.</p>
            </div>

            <form onSubmit={handleAddCategory} className="flex gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter a category name" 
                    className="border border-gray-300 p-2 rounded flex-1 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                >
                    {loading ? 'Adding...' : 'Add category'}
                </button>
            </form>

            <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
                <table className="min-w-full border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category name
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                Actions
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
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        
                        {categories.length === 0 && (
                            <tr>
                                <td colSpan="3" className="px-6 py-8 text-center text-gray-500 text-sm">
                                    No categories available.
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
