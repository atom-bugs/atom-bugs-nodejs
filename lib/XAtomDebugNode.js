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
var _a = require('atom'), BufferedProcess = _a.BufferedProcess, CompositeDisposable = _a.CompositeDisposable, Disposable = _a.Disposable;
var Debugger_1 = require("./Debugger");
var lodash_1 = require("lodash");
var XAtomDebugNode = (function () {
    function XAtomDebugNode() {
        this.name = 'Node.js';
        this.iconPath = 'atom://xatom-debug-nodejs/icons/nodejs.svg';
        this.debugger = new Debugger_1.Debugger();
    }
    XAtomDebugNode.prototype.activate = function () {
        require('atom-package-deps').install('xatom-debug', true);
    };
    XAtomDebugNode.prototype.deactivate = function () {
        if (this.provider) {
            this.provider.removePlugin(this.name);
            this.stop();
        }
    };
    XAtomDebugNode.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var options, scheme, host, port;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.stop();
                        return [4, this.session.getControlOptions()];
                    case 1:
                        options = _a.sent();
                        return [4, this.session.getSchemeOptions()];
                    case 2:
                        scheme = _a.sent();
                        host = '0.0.0.0';
                        port = 9000;
                        console.log('options', options, scheme);
                        this.session.status({
                            text: "Launching Node.js...",
                            loading: true
                        });
                        this.process = this.launcher.start('node', [
                            "--inspect-brk=" + host + ":" + port,
                            scheme.currentPath
                        ]);
                        this
                            .debugger
                            .attach(host, port)
                            .catch(function (e) {
                            _this.session.status({
                                text: 'Unable to attach debugger',
                                loading: false,
                                type: 'error'
                            });
                            _this.launcher.end();
                        })
                            .then(function (domains) { return __awaiter(_this, void 0, void 0, function () {
                            var _this = this;
                            var breakpoints;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!options.pauseOnException) return [3, 2];
                                        return [4, this.debugger.setPauseOnExceptions('all')];
                                    case 1:
                                        _a.sent();
                                        _a.label = 2;
                                    case 2: return [4, this.debugger.setBreakpointsActive(!options.disableBreakpoints)];
                                    case 3:
                                        _a.sent();
                                        this.session.status({
                                            text: 'Running on Node.js',
                                            loading: false,
                                            type: 'success'
                                        });
                                        return [4, this.session.getBreakpoints()];
                                    case 4:
                                        breakpoints = _a.sent();
                                        this.session.start();
                                        this.subscriptions = new CompositeDisposable(this.debugger.onDidPause(function (params) { return __awaiter(_this, void 0, void 0, function () {
                                            var _this = this;
                                            var callFrames;
                                            return __generator(this, function (_a) {
                                                this.session.pause();
                                                callFrames = [];
                                                lodash_1.get(params, 'callFrames', [])
                                                    .map(function (frame, index) {
                                                    var frameLocation = lodash_1.get(frame, 'location', {});
                                                    return _this
                                                        .debugger
                                                        .getScript(function (script) {
                                                        return script.scriptId === frameLocation.scriptId;
                                                    })
                                                        .then(function (script) {
                                                        var originalLocation = _this.debugger.getScriptOriginalLocation(script, frameLocation.lineNumber, frameLocation.columnNumber);
                                                        callFrames.push({
                                                            filePath: originalLocation.filePath,
                                                            functionName: frame.functionName,
                                                            lineNumber: originalLocation.lineNumber,
                                                            columnNumber: originalLocation.columnNumber
                                                        });
                                                        if (index === 0) {
                                                            if (params.reason === 'exception') {
                                                                _this.session.markException(originalLocation);
                                                            }
                                                            else {
                                                                _this.session.markLocation(originalLocation);
                                                            }
                                                        }
                                                    })
                                                        .catch(function (e) {
                                                        console.log('1 unable to get script', frameLocation.scriptId);
                                                    });
                                                })
                                                    .reduce(function (r, v) { return r.then(v); }, Promise.resolve())
                                                    .then(function () { return _this.session.setFrames(callFrames); });
                                                return [2];
                                            });
                                        }); }), this.debugger.onDidResume(function () {
                                            _this.session.resume();
                                        }), this.debugger.onDidLoadFile(function (filePath) {
                                            var breakpoint = breakpoints.find(function (b) {
                                                return filePath === b.filePath;
                                            });
                                            if (breakpoint) {
                                                _this.addBreakpoint(breakpoint);
                                            }
                                        }), this.debugger.onDidException(function (params) {
                                            _this.session.resume();
                                            var error = lodash_1.get(params, 'exceptionDetails.text', 'Uncaught');
                                            var description = lodash_1.get(params, 'exceptionDetails.exception.description', 'Exception');
                                            _this.session.status({
                                                text: error + " " + description,
                                                loading: false,
                                                type: 'error'
                                            });
                                        }));
                                        return [2];
                                }
                            });
                        }); });
                        return [2];
                }
            });
        });
    };
    XAtomDebugNode.prototype.stop = function () {
        if (this.process)
            this.process.kill();
        this.debugger.dettach();
        this.session.status({
            text: 'Finished running on Node.js',
            loading: false,
            type: 'warning'
        });
        this.session.end();
        if (this.subscriptions) {
            this.subscriptions.dispose();
        }
    };
    XAtomDebugNode.prototype.addBreakpoint = function (breakpoint) {
        return this.debugger.addBreakpoint(breakpoint);
    };
    XAtomDebugNode.prototype.removeBreakpoint = function (breakpoint) {
        return this.debugger.removeBreakpoint(breakpoint);
    };
    XAtomDebugNode.prototype.continue = function () {
        this.debugger.resume();
    };
    XAtomDebugNode.prototype.pause = function () {
        this.debugger.pause();
    };
    XAtomDebugNode.prototype.stepOver = function () {
        this.debugger.stepOver();
    };
    XAtomDebugNode.prototype.stepInto = function () {
        this.debugger.stepInto();
    };
    XAtomDebugNode.prototype.stepOut = function () {
        this.debugger.stepOut();
    };
    XAtomDebugNode.prototype.registerPlugin = function (provider) {
        this.provider = provider;
        this.session = provider.getSession();
        this.launcher = provider.getLauncher();
        provider.addPlugin(this.name, this);
    };
    return XAtomDebugNode;
}());
exports.XAtomDebugNode = XAtomDebugNode;
module.exports = new XAtomDebugNode();
//# sourceMappingURL=XAtomDebugNode.js.map