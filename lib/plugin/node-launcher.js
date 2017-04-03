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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
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
var events_1 = require("events");
var child_process_1 = require("child_process");
var http_1 = require("http");
var path_1 = require("path");
var NodeLauncher = (function () {
    function NodeLauncher() {
        this.maxAttempts = 3;
        this.attempt = 0;
        this.events = new events_1.EventEmitter();
    }
    NodeLauncher.prototype.didStop = function (cb) {
        this.events.on('didStop', cb);
    };
    NodeLauncher.prototype.didFail = function (cb) {
        this.events.on('didFail', cb);
    };
    NodeLauncher.prototype.didReceiveOutput = function (cb) {
        this.events.on('didReceiveOutput', cb);
    };
    NodeLauncher.prototype.didReceiveError = function (cb) {
        this.events.on('didReceiveError', cb);
    };
    NodeLauncher.prototype.normalizePath = function (dir) {
        return dir.replace(/^~/, process.env.HOME);
    };
    NodeLauncher.prototype.stop = function () {
        this.process.kill();
        this.process = null;
        this.events.emit('didStop');
    };
    NodeLauncher.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var launchArgs, options, output;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        launchArgs = [
                            "--inspect",
                            "--debug-brk=" + this.portNumber,
                            this.normalizePath(this.scriptPath)
                        ].concat(this.launchArguments);
                        options = {
                            detached: true,
                            shell: true,
                            cwd: this.cwd || this.normalizePath(path_1.dirname(this.scriptPath)),
                            env: this.environmentVariables
                        };
                        output = '';
                        if (!this.process) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.stop()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        this.process = child_process_1.spawn(this.binaryPath, launchArgs, options);
                        this.process.stdout.setEncoding('utf8');
                        this.process.stderr.setEncoding('utf8');
                        this.process.stdout.on('data', function (res) {
                            _this.events.emit('didReceiveOutput', res.toString());
                        });
                        this.process.stderr.on('data', function (res) {
                            output = output.concat(res.toString());
                            _this.events.emit('didReceiveError', res);
                        });
                        this.process.stdout.on('end', function (res) { return _this.events.emit('didReceiveOutput', res); });
                        this.process.stderr.on('end', function (res) { return _this.events.emit('didReceiveError', res); });
                        this.process.on('close', function (code) {
                            if (code !== 0) {
                                _this.events.emit('didFail');
                            }
                            _this.events.emit('didStop');
                        });
                        return [2 /*return*/, this.findSocketUrl()];
                }
            });
        });
    };
    NodeLauncher.prototype.getPages = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var req = http_1.request({
                hostname: _this.hostName,
                port: _this.portNumber,
                path: '/json',
                method: 'GET'
            }, function (res) {
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    try {
                        resolve(JSON.parse(String(chunk)));
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            });
            req.on('error', reject);
            req.end();
        });
    };
    NodeLauncher.prototype.findSocketUrl = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                var _this = this;
                var pages, found;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this
                                .getPages()
                                .catch(function () {
                                if (_this.attempt <= _this.maxAttempts) {
                                    resolve(_this.findSocketUrl());
                                }
                                else {
                                    reject('unable to get pages');
                                }
                            })];
                        case 1:
                            pages = _a.sent();
                            found = (pages || []).find(function (page) {
                                return Boolean(page.webSocketDebuggerUrl);
                            });
                            if (found) {
                                resolve(found.webSocketDebuggerUrl);
                            }
                            else {
                                reject('unable to find page with socket');
                            }
                            return [2 /*return*/];
                    }
                });
            }); }, 500);
        });
    };
    return NodeLauncher;
}());
exports.NodeLauncher = NodeLauncher;
//# sourceMappingURL=node-launcher.js.map