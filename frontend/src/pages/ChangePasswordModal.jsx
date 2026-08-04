import React, { useState } from 'react';
import { userService } from '../services/userService';

const ChangePasswordModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({ old_password: '', new_password: '', confirm_password: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(''); // Xóa lỗi khi người dùng gõ lại
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate Frontend
        if (formData.new_password !== formData.confirm_password) {
            return setError("Mật khẩu xác nhận không khớp!");
        }
        if (formData.new_password.length < 6) {
            return setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
        }

        setLoading(true);
        try {
            await userService.changePassword({
                old_password: formData.old_password,
                new_password: formData.new_password
            });
            setSuccess("Đổi mật khẩu thành công!");
            setTimeout(() => {
                onClose();
                setSuccess('');
                setFormData({ old_password: '', new_password: '', confirm_password: '' });
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.detail || "Đã xảy ra lỗi khi đổi mật khẩu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        // Lớp overlay mờ phía sau modal
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            {/* Hộp thoại Modal */}
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-center">Đổi Mật Khẩu</h2>
                
                {/* Hiển thị thông báo lỗi hoặc thành công */}
                {error && <div className="mb-4 p-2 bg-red-100 text-red-600 rounded">{error}</div>}
                {success && <div className="mb-4 p-2 bg-green-100 text-green-600 rounded">{success}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Input Mật khẩu hiện tại */}
                    <div className="mb-4">
                        <label className="block text-gray-700 font-medium mb-1">Mật khẩu hiện tại</label>
                        <input
                            type="password"
                            name="old_password"
                            value={formData.old_password}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                            required
                        />
                    </div>

                    {/* Input Mật khẩu mới */}
                    <div className="mb-4">
                        <label className="block text-gray-700 font-medium mb-1">Mật khẩu mới</label>
                        <input
                            type="password"
                            name="new_password"
                            value={formData.new_password}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                            required
                        />
                    </div>

                    {/* Input Xác nhận mật khẩu mới */}
                    <div className="mb-4">
                        <label className="block text-gray-700 font-medium mb-1">Xác nhận mật khẩu mới</label>
                        <input
                            type="password"
                            name="confirm_password"
                            value={formData.confirm_password}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                            required
                        />
                    </div>

                    {/* Nút hành động */}
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-blue-400"
                        >
                            {loading ? 'Đang xử lý...' : 'Xác nhận'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;