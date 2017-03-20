/// <reference types="node" />
import { EventEmitter } from 'events';
import { DebuggerProtocolClient } from './DebuggerProtocolClient';
export declare class NodeDebugger extends EventEmitter {
    private childProcess;
    protocol: DebuggerProtocolClient;
    scriptPath: string;
    binary: string;
    portNumber: number;
    stopScript(): Promise<boolean>;
    buildCallStack(): {
        name: any;
        columnNumber: any;
        lineNumber: any;
        filePath: any;
    }[];
    executeScript(): Promise<any>;
}
