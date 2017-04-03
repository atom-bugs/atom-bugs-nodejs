export interface Page {
    type: string;
    url: string;
    webSocketDebuggerUrl?: string;
}
export declare type Pages = Array<Page>;
export declare class NodeLauncher {
    portNumber: number;
    hostName: string;
    binaryPath: string;
    launchArguments: Array<string>;
    environmentVariables: Object;
    cwd: string;
    scriptPath: string;
    private process;
    private maxAttempts;
    private attempt;
    private events;
    didStop(cb: any): void;
    didFail(cb: any): void;
    didReceiveOutput(cb: any): void;
    didReceiveError(cb: any): void;
    normalizePath(dir: any): any;
    stop(): void;
    start(): Promise<string>;
    getPages(): Promise<Pages>;
    findSocketUrl(): Promise<string>;
}
