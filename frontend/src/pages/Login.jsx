import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";

const Login = () => {
    const [username, setUsername] = useState("") ;
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await authService.login(username, password);

            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed');
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-gray-800">
                    WMS Đăng Nhập
                </h2>
                
                {/* Hiển thị lỗi nếu có */}
                {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    {/* Trường Username */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                            Tên đăng nhập
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 text-gray-700 border rounded focus:outline-none focus:border-blue-500" 
                            placeholder="Nhập username"
                            required
                        />
                    </div>
                    
                    {/* Trường Password */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                            Mật khẩu
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 text-gray-700 border rounded focus:outline-none focus:border-blue-500" 
                            placeholder="Nhập mật khẩu"
                            required
                        />
                    </div>
                    
                    {/* Nút Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 px-4 font-bold text-white rounded focus:outline-none focus:shadow-outline transition-colors ${
                            loading 
                                ? 'bg-blue-400 cursor-not-allowed' 
                                : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                    >
                        {loading ? 'Đang xác thực...' : 'Đăng nhập'}
                    </button>
                </form>
            </div>
        </div>
    );

};

export default Login;