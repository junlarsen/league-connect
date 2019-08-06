declare module 'league-connect' {

    import WebSocket from 'ws';
    import { Response } from 'node-fetch';

    export interface Credentials {
        name: string;
        pid: number;
        port: number;
        token: string;
        protocol: 'http' | 'https'
    }

    export interface Request {
        url: string;
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        body?: any
    }

    export interface Connector {
        connect(): Promise<Credentials>;
        getWebSocket(credentials?: Credentials): Promise<WebSocket>;
        sendRequest(options: Request, credentials?: Credentials): Promise<Response>;
    }

    export default Connector;
}
