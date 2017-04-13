"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var plugin_1 = require("atom-bugs-chrome-debugger/lib/plugin");
var node_launcher_1 = require("./node-launcher");
var node_debugger_1 = require("./node-debugger");
var node_options_1 = require("./node-options");
var chokidar_1 = require("chokidar");
var path_1 = require("path");
var NodePlugin = (function (_super) {
    __extends(NodePlugin, _super);
    function NodePlugin() {
        var _this = _super.call(this) || this;
        _this.options = node_options_1.NodeOptions;
        _this.name = 'Node.js';
        _this.iconPath = 'atom://atom-bugs-nodejs/icons/nodejs.svg';
        _this.launcher = new node_launcher_1.NodeLauncher();
        _this.debugger = new node_debugger_1.NodeDebugger();
        _this.addEventListeners();
        return _this;
    }
    NodePlugin.prototype.didLaunchError = function (message) {
        atom.notifications.addError('Atom Bugs: Node.js', {
            detail: "Launcher error: " + message,
            dismissable: true
        });
    };
    NodePlugin.prototype.start = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var projectPath, socketUrl, _a, editor;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        projectPath = this.pluginClient.getPath();
                        this.debugger.skipFirstPause = true;
                        _a = options.runType;
                        switch (_a) {
                            case node_options_1.Runtype.CurrentFile: return [3 /*break*/, 1];
                            case node_options_1.Runtype.Script: return [3 /*break*/, 1];
                            case node_options_1.Runtype.Remote: return [3 /*break*/, 3];
                        }
                        return [3 /*break*/, 5];
                    case 1:
                        if (options.runType === node_options_1.Runtype.CurrentFile) {
                            editor = atom.workspace.getActiveTextEditor();
                            this.launcher.scriptPath = editor.getPath();
                        }
                        else {
                            this.launcher.scriptPath = options.scriptPath;
                            this.launcher.cwd = projectPath;
                        }
                        this.launcher.binaryPath = options.binaryPath;
                        this.launcher.portNumber = options.port;
                        this.launcher.launchArguments = options.launchArguments;
                        this.launcher.environmentVariables = options.environmentVariables;
                        return [4 /*yield*/, this.launcher.start()];
                    case 2:
                        socketUrl = _b.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        this.launcher.hostName = options.remoteUrl;
                        this.launcher.portNumber = options.remotePort;
                        return [4 /*yield*/, this.launcher.getSocketUrl()];
                    case 4:
                        socketUrl = _b.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        if (!socketUrl) return [3 /*break*/, 7];
                        this.pluginClient.run();
                        this.pluginClient.status.update('Connecting to Debugger');
                        return [4 /*yield*/, this.debugger.connect(socketUrl)];
                    case 6:
                        _b.sent();
                        this.pluginClient.status.update('Debugger Attached');
                        this.pluginClient.status.stopLoading();
                        _b.label = 7;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    NodePlugin.prototype.restart = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.didStop()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.start(options)];
                }
            });
        });
    };
    NodePlugin.prototype.didRun = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var options, projectPath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.pluginClient.status.startLoading();
                        this.pluginClient.status.update('Running process');
                        this.pluginClient.console.clear();
                        return [4 /*yield*/, this.pluginClient.getOptions()];
                    case 1:
                        options = _a.sent();
                        projectPath = this.pluginClient.getPath();
                        if (this.watcher) {
                            this.watcher.close();
                        }
                        if (options.restartOnChanges) {
                            this.watcher = chokidar_1.watch(path_1.resolve(projectPath, options.changesPattern || ''), {
                                ignored: [
                                    /[\/\\]\./,
                                    /node_modules/,
                                    /bower_components/
                                ]
                            });
                            this
                                .watcher
                                .on('change', function () { return _this.restart(options); })
                                .on('unlink', function () { return _this.restart(options); });
                        }
                        return [2 /*return*/, this.start(options)];
                }
            });
        });
    };
    return NodePlugin;
}(plugin_1.ChromeDebuggingProtocolPlugin));
exports.NodePlugin = NodePlugin;
//# sourceMappingURL=node-plugin.js.map