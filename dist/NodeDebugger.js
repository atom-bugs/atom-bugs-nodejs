'use babel';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { DebuggerProtocolClient } from './DebuggerProtocolClient';
export class NodeDebugger extends EventEmitter {
    constructor() {
        super(...arguments);
        this.protocol = new DebuggerProtocolClient();
        this.binary = '/usr/local/bin/node';
        this.portNumber = 5858;
    }
    stopScript() {
        return new Promise((resolve) => {
            this.childProcess.kill();
            this.protocol.disconnect();
            resolve(true);
        });
    }
    getCallStack() {
        let callStack = this.protocol.getCallStack();
        return callStack.map((frame) => {
            return {
                name: frame.functionName,
                columnNumber: frame.location.columnNumber,
                lineNumber: frame.location.lineNumber,
                filePath: frame.location.script.url
            };
        });
    }
    getScope() {
        let firstFrame = this.protocol.getFrameByIndex(0);
        let scope = [...firstFrame.scopeChain];
        if (firstFrame.this) {
            scope.unshift({
                type: 'this',
                object: firstFrame.this
            });
        }
        return scope.map((s) => {
            return {
                name: s.type,
                value: s.object
            };
        });
    }
    executeScript() {
        return __awaiter(this, void 0, void 0, function* () {
            let args = [
                `--inspect`,
                `--debug-brk=${this.portNumber}`,
                this.scriptPath
            ];
            if (this.childProcess) {
                yield this.stopScript();
            }
            this.childProcess = spawn(this.binary, args);
            this.childProcess.stdout.on('data', (res) => this.emit('data', res));
            this.childProcess.stderr.on('data', (res) => {
                if (String(res).match(/Waiting for the debugger to disconnect\.\.\./gi)) {
                    this.emit('close');
                }
                this.emit('data', res);
            });
            this.childProcess.stdout.on('end', (res) => this.emit('data', res));
            this.childProcess.stderr.on('end', (res) => this.emit('data', res));
            this.childProcess.on('close', (code) => this.emit('close', code));
            this.protocol.reset();
            return this.protocol.connect('localhost', this.portNumber);
        });
    }
}
//# sourceMappingURL=NodeDebugger.js.map