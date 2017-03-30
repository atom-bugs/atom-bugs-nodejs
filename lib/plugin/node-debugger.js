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
import { NodeDebuggerProtocol } from '../protocol/node-debugger-protocol';
import { dirname } from 'path';
export class NodeDebugger extends EventEmitter {
    constructor() {
        super(...arguments);
        this.protocol = new NodeDebuggerProtocol();
        this.binaryPath = '/usr/local/bin/node';
        this.hostName = 'localhost';
        this.portNumber = 5858;
        this.launchArguments = [];
        this.environmentVariables = {};
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
    connect() {
        this.protocol.reset();
        return this
            .protocol
            .connect(this.hostName, this.portNumber)
            .catch((error) => {
            this.emit('error', error.toString());
        });
    }
    normalizePath(dir) {
        return dir.replace(/^~/, process.env.HOME);
    }
    executeScript() {
        return __awaiter(this, void 0, void 0, function* () {
            let args = [
                `--inspect`,
                `--debug-brk=${this.portNumber}`,
                this.normalizePath(this.scriptPath)
            ].concat(this.launchArguments);
            let options = {
                detached: true,
                shell: true,
                cwd: this.cwd || this.normalizePath(dirname(this.scriptPath)),
                env: this.environmentVariables
            };
            let output = '';
            if (this.childProcess) {
                yield this.stopScript();
            }
            this.childProcess = spawn(this.binaryPath, args, options);
            this.childProcess.stdout.setEncoding('utf8');
            this.childProcess.stderr.setEncoding('utf8');
            this.childProcess.stdout.on('data', (res) => {
                this.emit('out', res.toString());
            });
            this.childProcess.stderr.on('data', (res) => {
                output = output.concat(res);
                this.emit('err', res);
            });
            this.childProcess.stdout.on('end', (res) => this.emit('out', res));
            this.childProcess.stderr.on('end', (res) => this.emit('err', res));
            this.childProcess.on('close', (code) => this.emit('close', code, output));
            return this.connect();
        });
    }
}
//# sourceMappingURL=node-debugger.js.map