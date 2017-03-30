/// <reference types="node" />
import { EventEmitter } from 'events';
import { NodeDebuggerProtocol } from '../protocol/node-debugger-protocol';
export declare class NodeDebugger extends EventEmitter {
    private childProcess;
    protocol: NodeDebuggerProtocol;
    scriptPath: string;
    binaryPath: string;
    hostName: string;
    cwd: string;
    portNumber: number;
    launchArguments: Array<string>;
    environmentVariables: Object;
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
    connect(): Promise<string | void>;
    normalizePath(dir: any): any;
    executeScript(): Promise<string | void>;
}
