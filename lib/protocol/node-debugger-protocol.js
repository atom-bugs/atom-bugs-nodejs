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
import { join, parse } from 'path';
import { readFile } from 'fs';
const { SourceMapConsumer } = require('source-map');
export class NodeDebuggerProtocol extends EventEmitter {
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
        if (this.client) {
            this.client.close();
            this.reset();
        }
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
        this.retry++;
        return this
            .getSocketTarget(hostname, port)
            .then((socketUrl) => {
            return new Promise((resolve, reject) => {
                this.nextRequestId = 0;
                this.connected = false;
                this.client = new WebSocket(socketUrl);
                this.client.onerror = (error) => {
                    if (this.retry < 3) {
                        setTimeout(() => {
                            resolve(this.connect(hostname, port));
                        }, 500);
                    }
                    else {
                        this.emit('error', error);
                        reject(error);
                    }
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
                this.client.onmessage = (message) => __awaiter(this, void 0, void 0, function* () {
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
                        let params = response.params;
                        switch (response.method) {
                            case 'Debugger.paused':
                                this.paused = true;
                                this.callFrames = params.callFrames;
                                this.emit('pause', params);
                                break;
                            case 'Debugger.resumed':
                                this.paused = false;
                                this.emit('resume', params);
                                break;
                            case 'Debugger.scriptParsed':
                                let script = {
                                    scriptId: params.scriptId,
                                    url: params.url,
                                    sourceMapURL: params.sourceMapURL
                                };
                                if (params.sourceMapURL) {
                                    let sourcePath = parse(params.url);
                                    let mappingPath = join(sourcePath.dir, params.sourceMapURL);
                                    let smc = yield this.getSourceMapConsumer(mappingPath);
                                    script.sourceMap = {
                                        getOriginalPosition(lineNumber, columnNumber) {
                                            let position = smc.originalPositionFor({
                                                line: lineNumber,
                                                column: columnNumber || 0
                                            });
                                            return {
                                                url: join(sourcePath.dir, position.source),
                                                lineNumber: position.line - 1,
                                                columnNumber: position.column
                                            };
                                        }
                                    };
                                    smc.sources.forEach((sourceUrl) => {
                                        let mapScript = {
                                            url: join(sourcePath.dir, sourceUrl),
                                            sourceMap: {
                                                getPosition(lineNumber, columnNumber) {
                                                    let position = smc.generatedPositionFor({
                                                        source: sourceUrl,
                                                        line: lineNumber,
                                                        column: columnNumber || 0
                                                    });
                                                    return {
                                                        url: params.url,
                                                        lineNumber: position.line - 1
                                                    };
                                                }
                                            }
                                        };
                                        this.emit('scriptParse', mapScript);
                                        this.scripts.push(mapScript);
                                    });
                                }
                                this.emit('scriptParse', script);
                                this.scripts.push(script);
                                break;
                            case 'Runtime.exceptionThrown':
                                this.emit('exception', params);
                                break;
                            case 'Runtime.consoleAPICalled':
                                this.emit('console', params);
                                break;
                            default:
                                console.log(response);
                        }
                    }
                });
                this.client.onclose = () => {
                    this.emit('close');
                };
            });
        });
    }
    getSourceMapConsumer(mappingPath) {
        return new Promise((resolve, reject) => {
            readFile(mappingPath, (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    let rawMapping = JSON.parse(data.toString());
                    let consumer = new SourceMapConsumer(rawMapping);
                    resolve(consumer);
                }
            });
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
                        expression: expression,
                        generatePreview: false,
                        silent: true,
                        returnByValue: false,
                        includeCommandLineAPI: false
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
    getScriptByUrl(url) {
        return this.scripts.find((s) => {
            return s.url === url;
        });
    }
    getCallStack() {
        return this.callFrames.map((frame) => {
            frame.location.script = this.getScriptById(parseInt(frame.location.scriptId));
            let sourceMap = frame.location.script.sourceMap;
            if (sourceMap) {
                let position = sourceMap.getOriginalPosition(frame.location.lineNumber + 1, frame.location.columnNumber);
                frame.location.script.url = position.url;
                frame.location.lineNumber = position.lineNumber;
                frame.location.columnNumber = position.columnNumber;
            }
            return frame;
        });
    }
    getFrameByIndex(index) {
        return this.callFrames[index];
    }
    setBreakpointFromScript(script, lineNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            let position = {
                url: script.url,
                lineNumber: lineNumber
            };
            if (script.sourceMap) {
                position = script.sourceMap.getPosition(lineNumber);
            }
            return yield this
                .send('Debugger.setBreakpointByUrl', position)
                .then((response) => {
                this.breakpoints.push({
                    id: response.breakpointId,
                    url: script.url,
                    columnNumber: 0,
                    lineNumber
                });
            });
        });
    }
    addBreakpoint(url, lineNumber) {
        let script = this.getScriptByUrl(url);
        if (script) {
            this.setBreakpointFromScript(script, lineNumber);
        }
        else {
            let listener = (script) => {
                if (script.url === url) {
                    this.setBreakpointFromScript(script, lineNumber);
                    this.removeListener('scriptParse', listener);
                }
            };
            this.addListener('scriptParse', listener);
        }
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
            let index = this.breakpoints.indexOf(breakpoint);
            this.breakpoints.splice(index, 1);
            return this.send('Debugger.removeBreakpoint', {
                breakpointId: breakpoint.id
            });
        }
    }
}
//# sourceMappingURL=node-debugger-protocol.js.map