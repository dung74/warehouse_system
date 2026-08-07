import api from "./api";

export const chatService = {
    ask: async (question) => (await api.post('/chat/', { question })).data,
};