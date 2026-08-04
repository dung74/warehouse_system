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
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
            <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
                <h2 className="text-2xl font-bold text-center text-gray-800">
                    Sign in to WMS
                </h2>
                {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 text-gray-700 border rounded focus:outline-none focus:border-blue-500" 
                            placeholder="Enter your username"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 text-gray-700 border rounded focus:outline-none focus:border-blue-500" 
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 px-4 font-bold text-white rounded focus:outline-none focus:shadow-outline transition-colors ${
                            loading 
                                ? 'bg-blue-400 cursor-not-allowed' 
                                : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>
            </div>
        </div>
    );

};

export default Login;
