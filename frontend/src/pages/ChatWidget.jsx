import React, { useState, useRef, useEffect } from 'react';
import { chatService } from '../services/chatService'; // Điều chỉnh path nếu cần

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', content: 'Xin chào! Tôi có thể giúp gì cho bạn về Nội quy và Quy trình WMS?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const endOfMessagesRef = useRef(null);

    // Tự động cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await chatService.ask(userMsg.content);
            setMessages(prev => [...prev, { role: 'bot', content: res.answer }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'bot', content: 'Lỗi kết nối đến hệ thống AI.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Nút mở Chat */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 text-2xl"
                >
                    🤖
                </button>
            )}

            {/* Khung Chat */}
            {isOpen && (
                <div className="w-80 sm:w-96 bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-200">
                    {/* Header */}
                    <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center shadow-sm">
                        <h3 className="font-semibold flex items-center gap-2">
                            🤖 WMS Assistant
                        </h3>
                        <button 
                            onClick={() => setIsOpen(false)} 
                            className="text-white hover:text-gray-200 font-bold text-lg leading-none p-1"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Body (Tin nhắn) */}
                    <div className="p-4 h-96 overflow-y-auto flex flex-col gap-3 bg-gray-50">
                        {messages.map((msg, idx) => (
                            <div 
                                key={idx} 
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div 
                                    className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-br-none shadow-md' 
                                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                                    }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="px-4 py-2 rounded-2xl rounded-bl-none max-w-[85%] text-sm bg-white text-gray-500 border border-gray-200 shadow-sm italic flex items-center gap-2">
                                    <span className="animate-pulse">Đang tìm tài liệu...</span>
                                </div>
                            </div>
                        )}
                        {/* Dùng để cuộn xuống cuối */}
                        <div ref={endOfMessagesRef} />
                    </div>

                    {/* Footer (Input) */}
                    <form 
                        onSubmit={handleSend} 
                        className="p-3 bg-white border-t border-gray-200 flex gap-2 items-center"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Hỏi về quy trình..."
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                        >
                            Gửi
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;