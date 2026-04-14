import { useEffect, useState } from 'react';
import { API_CONFIG } from '../config/api'; // Or directly hardcode standard address

export const useLiveStream = () => {
    const [liveData, setLiveData] = useState(null);

    useEffect(() => {
        // Change URL if your node backend is hosted somewhere else. Currently set to standard dev port.
        // Assuming API_CONFIG.BASE_URL exists or we can hardcode for local dev:
        const streamUrl = (API_CONFIG?.BASE_URL || '/api') + '/webhook/stream';
        
        const eventSource = new EventSource(streamUrl);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("[LiveStream] Nhận sự kiện mới từ TikTok:", data);
                // Tạo ID ngẫu nhiên để ép component trigger logic kể cả khi data trông giống nhau
                data._uid = Date.now() + Math.random();
                setLiveData(data);
            } catch (err) {
                console.error("Lỗi parse SSE data", err);
            }
        };

        eventSource.onerror = (err) => {
            console.error("Lỗi kết nối SSE, đang thử kết nối lại...", err);
        };

        return () => {
            eventSource.close();
        };
    }, []);

    return { liveData, clearLiveData: () => setLiveData(null) };
};
