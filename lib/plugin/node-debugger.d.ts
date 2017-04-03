export interface Script {
    scriptId?: string;
    url: string;
    sourceMapURL?: string;
    sourceMap?: any;
}
export declare class NodeDebugger {
    connected: boolean;
    paused: boolean;
    private protocol;
    private domains;
    private breakpoints;
    private scripts;
    private callFrames;
    private events;
    disconnect(): void;
    connect(socketUrl: string): Promise<void>;
    private getSourceMapConsumer(mappingPath);
    resume(): any;
    pause(): any;
    stepOver(): any;
    stepInto(): any;
    stepOut(): any;
    getProperties(params: any): any;
    evaluateOnFrames(expression: string, frames: Array<any>): Promise<{}>;
    evaluate(expression: string): Promise<{}>;
    getScriptById(scriptId: number): Script;
    getScriptByUrl(url: string): Script;
    getCallStack(): {
        name: any;
        columnNumber: any;
        lineNumber: any;
        filePath: any;
    }[];
    getFrameByIndex(index: number): any;
    setBreakpointFromScript(script: Script, lineNumber: number): Promise<void>;
    addBreakpoint(url: string, lineNumber: number): void;
    getBreakpointById(id: any): Promise<any>;
    removeBreakpoint(url: string, lineNumber: number): any;
    getScope(): {
        name: any;
        value: any;
    }[];
    didLoad(cb: Function): void;
    didClose(cb: Function): void;
    didLogMessage(cb: Function): void;
    didPause(cb: Function): void;
    didResume(cb: Function): void;
}
