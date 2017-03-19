'use babel';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { NodeDebugger } from './NodeDebugger';
export class NodePlugin {
    constructor() {
        this.name = 'Node.js';
        this.iconPath = 'atom://atom-bugs-nodejs/icons/nodejs.svg';
        this.options = {
            binaryPath: {
                type: 'text',
                name: 'Binary Path',
                value: '/usr/bin/local/node'
            }
        };
        this.debugger = new NodeDebugger();
        this.debugger.on('data', (message) => {
            console.log(String(message));
        });
        this.debugger.protocol.on('console', (params) => {
            params.args.forEach((a) => {
                switch (a.type) {
                    case 'string':
                        {
                            this.client.console[params.type](a.value);
                        }
                        ;
                        break;
                    default:
                        console.log('console called', params);
                }
            });
        });
        this.debugger.protocol.on('start', () => {
            let breaks = this.client.getBreakpoints();
            breaks.forEach((b) => {
                let { filePath, lineNumber } = b;
                this.didAddBreakpoint(filePath, lineNumber);
            });
        });
        this.debugger.protocol.on('close', (message) => {
            this.client.stop();
        });
        this.debugger.protocol.on('pause', (params) => {
            if (params.hitBreakpoints && params.hitBreakpoints.length > 0) {
                params.hitBreakpoints.forEach((id) => __awaiter(this, void 0, void 0, function* () {
                    let breakpoint = yield this.debugger.protocol.getBreakpointById(id);
                    this.client.activateBreakpoint(breakpoint.url, breakpoint.lineNumber);
                }));
            }
            console.log('pause', params);
            this.client.pause();
        });
        this.debugger.protocol.on('resume', () => {
            this.client.resume();
        });
    }
    registerClient(atomBugsClient) {
        this.client = atomBugsClient;
    }
    didRun(setup) {
        this.client.console.clear();
        this.debugger.scriptPath = setup.currentFile;
        this.debugger
            .executeScript()
            .then(() => {
            this.client.run();
        });
    }
    didStop() {
        this.client.console.clear();
        this.debugger
            .stopScript()
            .then(() => {
            this.client.stop();
        });
    }
    didResume() {
        this.debugger.protocol.resume();
    }
    didPause() {
        this.debugger.protocol.pause();
    }
    didAddBreakpoint(filePath, fileNumber) {
        if (this.debugger.protocol.isConnected()) {
            this.debugger.protocol.addBreakpoint(filePath, fileNumber);
        }
    }
    didRemoveBreakpoint(filePath, fileNumber) {
        if (this.debugger.protocol.isConnected()) {
            this.debugger.protocol.removeBreakpoint(filePath, fileNumber);
        }
    }
    didStepOver() {
        this.debugger.protocol.stepOver();
    }
    didStepInto() {
        this.debugger.protocol.stepInto();
    }
    didStepOut() {
        this.debugger.protocol.stepOut();
    }
    didEvaluateExpression(expression, range) {
        return __awaiter(this, void 0, void 0, function* () {
            let connected = this.debugger.protocol.isConnected();
            if (connected) {
                let result = yield this.debugger.protocol.evaluate(expression);
                if (result) {
                    this.client.showEvaluation(result, range);
                }
            }
        });
    }
}
//# sourceMappingURL=NodePlugin.js.map