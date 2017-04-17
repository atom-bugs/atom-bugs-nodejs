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
var plugin_1 = require("xatom-debug-chrome-base/lib/plugin");
var node_launcher_1 = require("./node-launcher");
var node_debugger_1 = require("./node-debugger");
var node_options_1 = require("./node-options");
var chokidar_1 = require("chokidar");
var path_1 = require("path");
var lodash_1 = require("lodash");
var NodePlugin = (function (_super) {
    __extends(NodePlugin, _super);
    function NodePlugin() {
        var _this = _super.call(this) || this;
        _this.options = node_options_1.NodeOptions;
        _this.name = 'Node.js';
        _this.iconPath = 'atom://xatom-debug-nodejs/icons/nodejs.svg';
        _this.launcher = new node_launcher_1.NodeLauncher();
        _this.debugger = new node_debugger_1.NodeDebugger();
        _this.addEventListeners();
        return _this;
    }
    NodePlugin.prototype.didLaunchError = function (message) {
        atom.notifications.addError('XAtom Debug: Node.js', {
            detail: "Launcher error: " + message,
            dismissable: true
        });
    };
    NodePlugin.prototype.start = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var projectPath, socketUrl, _a, editor, _b, _c, _d, _e, e_1;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _f.trys.push([0, 16, , 17]);
                        projectPath = this.pluginClient.getPath();
                        socketUrl = void 0;
                        this.debugger.skipFirstPause = true;
                        _a = options.runType;
                        switch (_a) {
                            case node_options_1.Runtype.CurrentFile: return [3, 1];
                            case node_options_1.Runtype.Script: return [3, 1];
                            case node_options_1.Runtype.Remote: return [3, 11];
                        }
                        return [3, 13];
                    case 1:
                        if (!(options.runType === node_options_1.Runtype.CurrentFile)) return [3, 4];
                        editor = atom.workspace.getActiveTextEditor();
                        if (!!lodash_1.isUndefined(editor)) return [3, 3];
                        _b = this.launcher;
                        return [4, this.normalizePath(editor.getPath())];
                    case 2:
                        _b.scriptPath = _f.sent();
                        _f.label = 3;
                    case 3: return [3, 7];
                    case 4:
                        _c = this.launcher;
                        return [4, this.normalizePath(options.scriptPath)];
                    case 5:
                        _c.scriptPath = _f.sent();
                        _d = this.launcher;
                        return [4, this.normalizePath(projectPath, true)];
                    case 6:
                        _d.cwd = _f.sent();
                        _f.label = 7;
                    case 7:
                        if (!lodash_1.isString(this.launcher.scriptPath)) return [3, 10];
                        _e = this.launcher;
                        return [4, this.normalizePath(options.binaryPath, true)];
                    case 8:
                        _e.binaryPath = _f.sent();
                        this.launcher.portNumber = options.port;
                        this.launcher.launchArguments = options.launchArguments;
                        this.launcher.environmentVariables = options.environmentVariables;
                        return [4, this.launcher.start()];
                    case 9:
                        socketUrl = _f.sent();
                        _f.label = 10;
                    case 10: return [3, 13];
                    case 11:
                        this.launcher.hostName = options.remoteUrl;
                        this.launcher.portNumber = options.remotePort;
                        return [4, this.launcher.getSocketUrl()];
                    case 12:
                        socketUrl = _f.sent();
                        return [3, 13];
                    case 13:
                        if (!socketUrl) return [3, 15];
                        this.pluginClient.run();
                        this.pluginClient.status.update('Connecting to debugger');
                        return [4, this
                                .debugger
                                .connect(socketUrl)
                                .then(function () {
                                _this.pluginClient.status.update('Debugger attached', 'status-success');
                                _this.pluginClient.status.stopLoading();
                            })];
                    case 14:
                        _f.sent();
                        _f.label = 15;
                    case 15: return [3, 17];
                    case 16:
                        e_1 = _f.sent();
                        this.pluginClient.status.update(e_1, 'status-error');
                        this.pluginClient.status.stopLoading();
                        return [3, 17];
                    case 17: return [2];
                }
            });
        });
    };
    NodePlugin.prototype.restart = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.didStop()];
                    case 1:
                        _a.sent();
                        this.pluginClient.status.startLoading();
                        this.pluginClient.status.update('Restarting to debugger');
                        return [2, this.start(options)];
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
                        this.pluginClient.status.update('Running node');
                        this.pluginClient.console.clear();
                        return [4, this.pluginClient.getOptions()];
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
                        return [2, this.start(options)];
                }
            });
        });
    };
    return NodePlugin;
}(plugin_1.ChromeDebuggingProtocolPlugin));
exports.NodePlugin = NodePlugin;
//# sourceMappingURL=node-plugin.js.map