import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import { WebSocketMessage } from '../types';

export const setupWebSocket = (server: http.Server) => {
    const wss = new WebSocketServer({ server });

    const broadcastToClients = (data: any): void => {
        wss.clients.forEach((client: WebSocket) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    };

    wss.on('connection', (ws: WebSocket & { subscriptions?: string[] }) => {
        console.log('Client connected to WebSocket');
        
        ws.on('message', (message: WebSocket.RawData) => {
            try {
                const data: WebSocketMessage = JSON.parse(message.toString());
                if (data.type === 'subscribe') {
                    ws.subscriptions = data.channels || [];
                }
            } catch (error) {
                console.error('Invalid WebSocket message:', error);
            }
        });

        ws.on('close', () => {
            console.log('Client disconnected from WebSocket');
        });
    });

    return { wss, broadcastToClients };
};

