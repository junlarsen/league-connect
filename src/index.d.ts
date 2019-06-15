declare module 'league-connect' {

    import WebSocket from 'ws';

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

    export class Connector {

        static connect(): Promise<Credentials>;

        static getWebSocket(): Promise<WebSocket>;

        static sendRequest(options: Request, credentials: Credentials): Promise<any>;

    }

    export default Connector;
}
