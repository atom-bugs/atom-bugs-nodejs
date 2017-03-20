'use babel';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { request } from 'http';
import { EventEmitter } from 'events';
export class DebuggerProtocolClient extends EventEmitter {
    constructor() {
        super(...arguments);
        this.connected = false;
        this.paused = false;
        this.nextRequestId = 0;
        this.retry = 0;
        this.breakpoints = [];
        this.scripts = [];
        this.callFrames = [];
        this.subscriptions = [];
    }
    isConnected() {
        return this.connected;
    }
    isPaused() {
        return this.paused;
    }
    disconnect() {
        this.client = null;
        this.paused = false;
        this.connected = false;
    }
    send(method, params) {
        return new Promise((resolve, reject) => {
            let requestBody = {
                id: this.nextRequestId,
                method: method
            };
            if (params) {
                requestBody['params'] = params;
            }
            this.subscriptions[requestBody.id] = {
                resolve: resolve,
                reject: reject
            };
            this.client.send(JSON.stringify(requestBody));
            this.nextRequestId++;
        });
    }
    getSocketTarget(hostname, port) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                let req = request({
                    hostname,
                    port,
                    path: '/json',
                    method: 'GET'
                }, (res) => {
                    res.setEncoding('utf8');
                    res.on('data', (chunk) => {
                        try {
                            let targets = JSON.parse(String(chunk));
                            let socketUrl = false;
                            targets.forEach((target) => {
                                if (target.webSocketDebuggerUrl) {
                                    socketUrl = target.webSocketDebuggerUrl;
                                }
                            });
                            socketUrl ? resolve(socketUrl) : reject('Could not find socket url.');
                        }
                        catch (e) {
                            reject(e);
                        }
                    });
                });
                req.on('error', reject);
                req.end();
            }, 500);
        });
    }
    connect(hostname, port) {
        return __awaiter(this, void 0, void 0, function* () {
            this.retry++;
            let target = yield this
                .getSocketTarget(hostname, port)
                .then((socketUrl) => {
                return new Promise((resolve, reject) => {
                    this.nextRequestId = 0;
                    this.connected = false;
                    this.client = new WebSocket(socketUrl);
                    this.client.onerror = (error) => {
                        this.emit('error', error);
                        reject(error);
                    };
                    this.client.onopen = () => __awaiter(this, void 0, void 0, function* () {
                        yield Promise
                            .all([
                            this.send('Runtime.enable'),
                            this.send('Debugger.enable'),
                            this.send('Debugger.setPauseOnExceptions', { state: 'none' }),
                            this.send('Debugger.setAsyncCallStackDepth', { maxDepth: 0 }),
                            this.send('Profiler.enable'),
                            this.send('Profiler.setSamplingInterval', { interval: 100 }),
                            this.send('Debugger.setBlackboxPatterns', { patterns: [] }),
                            this.send('Runtime.runIfWaitingForDebugger')
                        ])
                            .then(() => {
                            this.connected = true;
                            this.emit('start');
                        });
                        resolve(this.connected);
                    });
                    this.client.onmessage = (message) => {
                        let response = JSON.parse(message.data);
                        if (response.id > -1 && this.subscriptions[response.id]) {
                            let subscription = this.subscriptions[response.id];
                            if (response.result) {
                                subscription.resolve(response.result);
                            }
                            else {
                                subscription.reject(response.error);
                            }
                        }
                        else {
                            switch (response.method) {
                                case 'Debugger.paused':
                                    {
                                        this.paused = true;
                                        this.callFrames = response.params.callFrames;
                                        this.emit('pause', response.params);
                                    }
                                    break;
                                case 'Debugger.resumed':
                                    {
                                        this.paused = false;
                                        this.emit('resume', response.params);
                                    }
                                    break;
                                case 'Debugger.scriptParsed':
                                    {
                                        this.scripts.push(response.params);
                                    }
                                    break;
                                case 'Runtime.consoleAPICalled':
                                    {
                                        this.emit('console', response.params);
                                    }
                                    break;
                                default:
                                    console.log(response);
                            }
                        }
                    };
                    this.client.onclose = () => {
                        this.emit('close');
                    };
                });
            })
                .catch((message) => {
                if (this.retry === 3) {
                    console.error(message);
                }
            });
            if (target) {
                return true;
            }
            else if (this.retry < 3) {
                return this.connect(hostname, port);
            }
            else {
                return false;
            }
        });
    }
    reset() {
        this.retry = 0;
        this.breakpoints = [];
        this.scripts = [];
        this.subscriptions = [];
    }
    resume() {
        return this.send('Debugger.resume');
    }
    pause() {
        return this.send('Debugger.pause');
    }
    stepOver() {
        return this.send('Debugger.stepOver');
    }
    stepInto() {
        return this.send('Debugger.stepInto');
    }
    stepOut() {
        return this.send('Debugger.stepOut');
    }
    getProperties(options) {
        return this.send('Runtime.getProperties', options);
    }
    evaluateOnFrames(expression, frames) {
        return new Promise((resolve, reject) => {
            if (frames.length > 0) {
                let frame = frames.shift();
                if (frame && frame.callFrameId) {
                    this
                        .send('Debugger.evaluateOnCallFrame', {
                        callFrameId: frame.callFrameId,
                        expression: expression
                    })
                        .then((result) => {
                        let lookOnParent = frames.length > 0 &&
                            result.result.subtype === 'error' &&
                            result.result.className !== 'SyntaxError';
                        if (lookOnParent) {
                            resolve(this.evaluateOnFrames(expression, frames));
                        }
                        else if (result && !result.exceptionDetails) {
                            resolve(result);
                        }
                        else {
                            reject(result);
                        }
                    });
                }
                else {
                    reject('frame has no id');
                }
            }
            else {
                reject('there are no frames to evaluate');
            }
        });
    }
    evaluate(expression) {
        let frames = [...(this.callFrames || [])];
        return this.evaluateOnFrames(expression, frames);
    }
    getScriptById(scriptId) {
        return this.scripts.find((s) => {
            return parseInt(s.scriptId) === scriptId;
        });
    }
    getCallStack() {
        return this.callFrames.map((frame) => {
            frame.location.script = this.getScriptById(parseInt(frame.location.scriptId));
            return frame;
        });
    }
    addBreakpoint(url, lineNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this
                .send('Debugger.setBreakpointByUrl', {
                url,
                lineNumber: (lineNumber - 1)
            })
                .then((response) => {
                this.breakpoints.push({
                    id: response.breakpointId,
                    url,
                    columnNumber: 0,
                    lineNumber
                });
            });
        });
    }
    getBreakpointById(id) {
        return new Promise((resolve, reject) => {
            let found = this.breakpoints.find((b) => {
                return (b.id === id);
            });
            resolve(found);
        });
    }
    removeBreakpoint(url, lineNumber) {
        let breakpoint = this.breakpoints.find((b) => {
            return (b.url === url && b.lineNumber === lineNumber);
        });
        if (breakpoint) {
            return this.send('Debugger.removeBreakpoint', {
                breakpointId: breakpoint.id
            });
        }
    }
}
//# sourceMappingURL=DebuggerProtocolClient.js.map