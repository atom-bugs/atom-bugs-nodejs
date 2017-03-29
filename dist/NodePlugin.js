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
import { Runtype, NodeOptions } from './NodeOptions';
export class NodePlugin {
    constructor() {
        this.name = 'Node.js';
        this.iconPath = 'atom://atom-bugs-nodejs/icons/nodejs.svg';
        this.options = NodeOptions;
        this.debugger = new NodeDebugger();
        this.debugger.on('err', (message) => {
            if (message) {
                this.client.console.info(message.toString());
            }
        });
        this.debugger.protocol.on('console', (params) => {
            params.args.forEach((a) => {
                switch (a.type) {
                    case 'string':
                        {
                            this.client.console[params.type](a.value);
                        }
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
            this.client.setCallStack(this.debugger.getCallStack());
            this.client.setScope(this.debugger.getScope());
            this.client.pause();
        });
        this.debugger.protocol.on('resume', () => {
            this.client.resume();
        });
    }
    register(client) {
        this.client = client;
    }
    didRun() {
        return __awaiter(this, void 0, void 0, function* () {
            this.client.console.clear();
            let options = this.client.getOptions();
            console.log(options);
            switch (options.runType) {
                case Runtype.CurrentFile:
                    let editor = atom.workspace.getActiveTextEditor();
                    this.debugger.scriptPath = editor.getPath();
                    this.debugger.binaryPath = options.binaryPath;
                    this.debugger.portNumber = options.port;
                    this.debugger.executeScript().then(() => {
                        this.client.run();
                    });
                    break;
                case Runtype.Script:
                    this.debugger.scriptPath = this.client.getPathFromFile(options.scriptPath);
                    this.debugger.binaryPath = options.binaryPath;
                    this.debugger.portNumber = options.port;
                    this.debugger.executeScript().then(() => {
                        this.client.run();
                    });
                    break;
                case Runtype.Remote:
                    this.debugger.hostName = options.remoteUrl;
                    this.debugger.portNumber = options.remotePort;
                    this.debugger.connect().then(() => {
                        this.client.run();
                    });
                    break;
            }
        });
    }
    didStop() {
        this.client.console.clear();
        this.debugger.stopScript().then(() => this.client.stop());
    }
    didResume() {
        this.debugger.protocol.resume();
    }
    didPause() {
        return __awaiter(this, void 0, void 0, function* () {
            let connected = this.debugger.protocol.isConnected();
            if (connected) {
                this.debugger.protocol.pause();
            }
        });
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
    didRequestProperties(request, propertyView) {
        return __awaiter(this, void 0, void 0, function* () {
            let properties = yield this.debugger.protocol.getProperties({
                accessorPropertiesOnly: false,
                generatePreview: false,
                objectId: request.objectId,
                ownProperties: true
            });
            propertyView.insertFromDescription(properties.result);
        });
    }
    didEvaluateExpression(expression, evaluationView) {
        return __awaiter(this, void 0, void 0, function* () {
            let connected = this.debugger.protocol.isConnected();
            let paused = this.debugger.protocol.isPaused();
            if (connected && paused) {
                let response = yield this
                    .debugger
                    .protocol
                    .evaluate(expression)
                    .catch((e) => {
                });
                if (response) {
                    let result = response.result;
                    if (result) {
                        evaluationView.insertFromResult(result);
                    }
                }
            }
        });
    }
}
//# sourceMappingURL=NodePlugin.js.map