import api from './api';

export const transactionService = {
    getAll: async (params) => {
        const response = await api.get('/transactions', { params });
        return response.data;
    },
    create: async (transactionPayload) => {
        const response = await api.post('/transactions/', transactionPayload);
        return response.data;
    },
    approve: async (transactionId, warehouseId) => {
        const response = await api.post(`/transactions/${transactionId}/approve?warehouse_id=${warehouseId}`);
        return response.data;
    },
    cancel: async (transactionId, warehouseId, reason) => {
        const payload = { cancellation_reason: reason };
        console.log("Gửi lên API payload:", payload);
        const response = await api.post(`/transactions/${transactionId}/cancel?warehouse_id=${warehouseId}`, payload);
        return response.data;
    }
};

