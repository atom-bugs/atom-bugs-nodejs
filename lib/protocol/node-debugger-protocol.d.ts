/// <reference types="node" />
import { EventEmitter } from 'events';
export interface Script {
    scriptId?: string;
    url: string;
    sourceMapURL?: string;
    sourceMap?: any;
}
export declare class NodeDebuggerProtocol extends EventEmitter {
    private retry;
    private connected;
    private paused;
    private client;
    private nextRequestId;
    private breakpoints;
    private scripts;
    private callFrames;
    private subscriptions;
    isConnected(): boolean;
    isPaused(): boolean;
    reset(): void;
    disconnect(): void;
    send(method: any, params?: any): Promise<{}>;
    connect(socketUrl: string): Promise<{}>;
    private getSourceMapConsumer(mappingPath);
    resume(): Promise<{}>;
    pause(): Promise<{}>;
    stepOver(): Promise<{}>;
    stepInto(): Promise<{}>;
    stepOut(): Promise<{}>;
    getProperties(options: any): Promise<{}>;
    evaluateOnFrames(expression: string, frames: Array<any>): Promise<{}>;
    evaluate(expression: string): Promise<{}>;
    getScriptById(scriptId: number): Script;
    getScriptByUrl(url: string): Script;
    getCallStack(): any[];
    getFrameByIndex(index: number): any;
    setBreakpointFromScript(script: Script, lineNumber: number): Promise<void>;
    addBreakpoint(url: string, lineNumber: number): void;
    getBreakpointById(id: any): Promise<any>;
    removeBreakpoint(url: string, lineNumber: number): Promise<{}>;
}
