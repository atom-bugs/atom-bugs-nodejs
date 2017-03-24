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
    getCallStack(): {
        name: any;
        columnNumber: any;
        lineNumber: any;
        filePath: any;
    }[];
    getScope(): {
        name: any;
        value: any;
    }[];
    executeScript(): Promise<any>;
}
