'use babel';
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var _a = require('atom'), Emitter = _a.Emitter, CompositeDisposable = _a.CompositeDisposable;
var SourceMapConsumer = require('source-map').SourceMapConsumer;
var path_1 = require("path");
var fs_1 = require("fs");
var http_1 = require("http");
var chrome_debugging_protocol_1 = require("chrome-debugging-protocol");
var Debugger = (function () {
    function Debugger() {
        this.emitter = new Emitter();
        this.scripts = [];
        this.breakpoints = [];
        this.sourcemaps = [];
    }
    Debugger.prototype.onDidPause = function (cb) {
        return this.emitter.on('didPause', cb);
    };
    Debugger.prototype.onDidPauseOnLocation = function (cb) {
        return this.emitter.on('didPauseOnLocation', cb);
    };
    Debugger.prototype.onDidResume = function (cb) {
        return this.emitter.on('didResume', cb);
    };
    Debugger.prototype.onDidException = function (cb) {
        return this.emitter.on('didException', cb);
    };
    Debugger.prototype.onDidAddScript = function (cb) {
        return this.emitter.on('didAddScript', cb);
    };
    Debugger.prototype.onDidLoadFile = function (cb) {
        return this.emitter.on('didLoadFile', cb);
    };
    Debugger.prototype.getScriptOriginalLocation = function (script, lineNumber, columnNumber) {
        var fileLocation = {
            filePath: script.url,
            lineNumber: lineNumber,
            columnNumber: columnNumber || 0
        };
        if (script.sourcemapConsumer) {
            var sourceLocation = {
                line: lineNumber + 1,
                column: columnNumber || 0,
                bias: SourceMapConsumer.LEAST_UPPER_BOUND
            };
            var position = script.sourcemapConsumer.originalPositionFor(sourceLocation);
            if (position.source === null) {
                sourceLocation.bias = SourceMapConsumer.GREATEST_LOWER_BOUND;
                position = script.sourcemapConsumer.originalPositionFor(sourceLocation);
            }
            if (position.source) {
                fileLocation.filePath = position.source;
                fileLocation.lineNumber = position.line - 1;
                fileLocation.columnNumber = position.column;
            }
        }
        return fileLocation;
    };
    Debugger.prototype.getScript = function (cb) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var script = _this.scripts.find(cb);
            if (script) {
                resolve(script);
            }
            else {
                var handler_1;
                var disposable_1 = _this.emitter.on('didAddScript', function (script) {
                    if (cb(script)) {
                        clearTimeout(handler_1);
                        resolve(script);
                    }
                });
                handler_1 = setTimeout(function () {
                    disposable_1.dispose();
                    reject('Unable to get script');
                }, 5000);
            }
        });
    };
    Debugger.prototype.setup = function () {
        var _this = this;
        var _a = this.protocol.getDomains(), Profiler = _a.Profiler, Runtime = _a.Runtime, Debugger = _a.Debugger, Page = _a.Page;
        Debugger.scriptParsed(function (params) {
            _this.addScript(params);
        });
        Debugger.paused(function (params) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.emitter.emit('didPause', params);
                return [2];
            });
        }); });
        Debugger.resumed(function (params) {
            _this.emitter.emit('didResume');
        });
        Runtime.exceptionThrown(function (params) {
            _this.emitter.emit('didException', params);
        });
        Runtime.consoleAPICalled(function (params) {
            console.log('consoleAPICalled', params);
        });
        return Promise.all([
            Runtime.enable(),
            Debugger.enable(),
            Debugger.setPauseOnExceptions({ state: 'none' }),
            Debugger.setAsyncCallStackDepth({ maxDepth: 0 }),
            Debugger.setBreakpointsActive({
                active: true
            }),
            Profiler.enable(),
            Profiler.setSamplingInterval({ interval: 100 }),
            Debugger.setBlackboxPatterns({ patterns: [] }),
            Runtime.runIfWaitingForDebugger()
        ]);
    };
    Debugger.prototype.setPauseOnExceptions = function (state) {
        var Debugger = this.protocol.getDomains().Debugger;
        return Debugger.setPauseOnExceptions({ state: state });
    };
    Debugger.prototype.setBreakpointsActive = function (active) {
        var Debugger = this.protocol.getDomains().Debugger;
        return Debugger.setBreakpointsActive({ active: active });
    };
    Debugger.prototype.addSourceMap = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var scriptUrl, isBase64, sourceMapContent, sourceMapObject, consumer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        scriptUrl = path_1.parse(params.url);
                        isBase64 = params.sourceMapURL.match(/^data\:application\/json\;(charset=.+)?base64\,(.+)$/);
                        sourceMapContent = '';
                        if (!isBase64) return [3, 1];
                        sourceMapContent = Buffer.from(isBase64[2], 'base64').toString();
                        return [3, 3];
                    case 1: return [4, new Promise(function (resolve, reject) {
                            var sourceMapPath = path_1.resolve(scriptUrl.dir, params.sourceMapURL);
                            fs_1.readFile(sourceMapPath, function (err, data) {
                                if (err)
                                    return reject(err);
                                resolve(data.toString());
                            });
                        })];
                    case 2:
                        sourceMapContent = _a.sent();
                        _a.label = 3;
                    case 3: return [4, new Promise(function (resolve, reject) {
                            try {
                                resolve(JSON.parse(sourceMapContent));
                            }
                            catch (e) {
                                reject(e);
                            }
                        })];
                    case 4:
                        sourceMapObject = _a.sent();
                        sourceMapObject.file = params.url;
                        sourceMapObject.sources = sourceMapObject.sources.map(function (filePath) {
                            var sourcePath = path_1.resolve(scriptUrl.dir, sourceMapObject.sourceRoot, filePath);
                            _this.loadScript(sourcePath);
                            return sourcePath;
                        });
                        consumer = new SourceMapConsumer(sourceMapObject);
                        this.sourcemaps.push(consumer);
                        return [2, consumer];
                }
            });
        });
    };
    Debugger.prototype.loadScript = function (fileUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var fileExists;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, new Promise(function (resolve) {
                            fs_1.stat(fileUrl, function (err) { return resolve(err ? false : true); });
                        })];
                    case 1:
                        fileExists = _a.sent();
                        if (fileExists) {
                            this.emitter.emit('didLoadFile', fileUrl);
                        }
                        return [2];
                }
            });
        });
    };
    Debugger.prototype.addScript = function (script) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!script.sourceMapURL) return [3, 2];
                        _a = script;
                        return [4, this.addSourceMap(script)];
                    case 1:
                        _a.sourcemapConsumer = _b.sent();
                        _b.label = 2;
                    case 2:
                        this.scripts.push(script);
                        this.emitter.emit('didAddScript', script);
                        this.loadScript(script.url);
                        return [2];
                }
            });
        });
    };
    Debugger.prototype.requestIfRunning = function (cb) {
        if (this.isRunning) {
            return cb(this.protocol.getDomains());
        }
        return Promise.resolve();
    };
    Debugger.prototype.addBreakpoint = function (breakpoint) {
        var _this = this;
        return this.requestIfRunning(function (_a) {
            var Debugger = _a.Debugger;
            return __awaiter(_this, void 0, void 0, function () {
                var _this = this;
                var script, breakpointLocation, consumer, fileLocation, position;
                return __generator(this, function (_a) {
                    script = this.scripts.find(function (script) {
                        return script.url === breakpoint.filePath;
                    });
                    breakpointLocation = {
                        url: breakpoint.filePath,
                        lineNumber: breakpoint.lineNumber - 1,
                        columnNumber: breakpoint.columnNumber || 0
                    };
                    if (!script) {
                        consumer = this.sourcemaps.find(function (s) {
                            return s.sources.includes(breakpoint.filePath);
                        });
                        if (consumer) {
                            fileLocation = {
                                source: breakpoint.filePath,
                                line: breakpoint.lineNumber,
                                column: breakpoint.columnNumber || 0,
                                bias: SourceMapConsumer.LEAST_UPPER_BOUND
                            };
                            position = consumer.generatedPositionFor(fileLocation);
                            if (position.line === null) {
                                fileLocation.bias = SourceMapConsumer.GREATEST_LOWER_BOUND;
                                position = consumer.generatedPositionFor(fileLocation);
                            }
                            if (position) {
                                breakpointLocation.url = consumer.file;
                                breakpointLocation.lineNumber = position.line - 1;
                                breakpointLocation.columnNumber = position.column;
                            }
                        }
                    }
                    return [2, Debugger
                            .setBreakpointByUrl(breakpointLocation)
                            .then(function (params) {
                            _this.breakpoints.push(Object.assign(params, breakpoint));
                        })];
                });
            });
        });
    };
    Debugger.prototype.removeBreakpoint = function (breakpoint) {
        var _this = this;
        return this.requestIfRunning(function (_a) {
            var Debugger = _a.Debugger;
            var item = _this.breakpoints.find(function (b) {
                return b.filePath === breakpoint.filePath &&
                    b.lineNumber === breakpoint.lineNumber &&
                    b.columnNumber === breakpoint.columnNumber;
            });
            if (item) {
                return Debugger
                    .removeBreakpoint({
                    breakpointId: item.breakpointId
                })
                    .then(function () {
                    var index = _this.breakpoints.indexOf(item);
                    _this.breakpoints.splice(index, 1);
                });
            }
            return Promise.resolve();
        });
    };
    Debugger.prototype.resume = function () {
        return this.requestIfRunning(function (_a) {
            var Debugger = _a.Debugger;
            return Debugger.resume();
        });
    };
    Debugger.prototype.pause = function () {
        return this.requestIfRunning(function (_a) {
            var Debugger = _a.Debugger;
            return Debugger.pause();
        });
    };
    Debugger.prototype.stepOver = function () {
        return this.requestIfRunning(function (_a) {
            var Debugger = _a.Debugger;
            return Debugger.stepOver();
        });
    };
    Debugger.prototype.stepInto = function () {
        return this.requestIfRunning(function (_a) {
            var Debugger = _a.Debugger;
            return Debugger.stepInto();
        });
    };
    Debugger.prototype.stepOut = function () {
        return this.requestIfRunning(function (_a) {
            var Debugger = _a.Debugger;
            return Debugger.stepOut();
        });
    };
    Debugger.prototype.attach = function (hostname, port) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var sockets, socket;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this
                            .getSockets(hostname, port, 5)
                            .catch(function (error) {
                            throw new Error(error);
                        })];
                    case 1:
                        sockets = _a.sent();
                        if (!(sockets && sockets.length > 0)) return [3, 4];
                        socket = sockets[0];
                        this.protocol = new chrome_debugging_protocol_1.ChromeDebuggingProtocol(socket.webSocketDebuggerUrl);
                        return [4, this.protocol.connect()];
                    case 2:
                        _a.sent();
                        return [4, this.setup().then(function () {
                                _this.isRunning = true;
                            })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2, false];
                }
            });
        });
    };
    Debugger.prototype.dettach = function () {
        if (this.protocol) {
            this.protocol.disconnect();
            this.protocol = undefined;
            this.isRunning = false;
            this.sourcemaps = [];
            this.scripts = [];
            this.breakpoints = [];
        }
    };
    Debugger.prototype.getSockets = function (hostname, port, attempts) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var errorHandler = function (e) {
                if (attempts && attempts > 0) {
                    attempts--;
                    setTimeout(function () { return resolve(_this.getSockets(hostname, port, attempts)); }, 500);
                }
                else {
                    reject(e);
                }
            };
            var req = http_1.request({
                hostname: hostname,
                port: port,
                path: '/json',
                method: 'GET'
            }, function (res) {
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    try {
                        var json = JSON.parse(chunk.toString());
                        resolve(json.filter(function (page) { return page.webSocketDebuggerUrl; }));
                    }
                    catch (e) {
                        errorHandler(e);
                    }
                });
            });
            req.on('error', errorHandler);
            req.end();
        });
    };
    return Debugger;
}());
exports.Debugger = Debugger;
//# sourceMappingURL=Debugger.js.map