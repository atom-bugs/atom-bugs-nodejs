/// <reference types="node" />
import { EventEmitter } from 'events';
export interface DebuggerBreakpoint {
    id: number;
    url: string;
    columnNumber: number;
    lineNumber: number;
}
export declare class DebuggerProtocolClient extends EventEmitter {
    private connected;
    private client;
    private nextRequestId;
    private retry;
    private breakpoints;
    private scripts;
    private callFrames;
    private subscriptions;
    isConnected(): boolean;
    disconnect(): void;
    send(method: any, params?: any): Promise<{}>;
    private getSocketTarget(hostname, port);
    connect(hostname: string, port: number): any;
    reset(): void;
    resume(): Promise<{}>;
    pause(): Promise<{}>;
    stepOver(): Promise<{}>;
    stepInto(): Promise<{}>;
    stepOut(): Promise<{}>;
    evaluateOnFrames(expression: string, frames: Array<any>): Promise<{}>;
    evaluate(expression: string): Promise<{}>;
    addBreakpoint(url: string, lineNumber: number): Promise<void>;
    getBreakpointById(id: any): Promise<DebuggerBreakpoint>;
    removeBreakpoint(url: string, lineNumber: number): Promise<{}>;
}
