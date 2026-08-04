import api from './api';

export const authService = {
    login: async (username, password) => {

        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await api.post('/auth/login', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        const token = response.data.access_token;
        localStorage.setItem('access_token', token);
        
        const userInfo = await authService.getCurrentUser();
        localStorage.setItem('user_role', userInfo.role_id);
        localStorage.setItem('username', userInfo.username);
        localStorage.setItem('full_name', userInfo.full_name);
        localStorage.setItem('warehouse_id', userInfo.warehouse_id);
        return response.data;
    
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('username');
        window.location.href = '/login';

    },


    getCurrentUser: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    }
};

export default authService;