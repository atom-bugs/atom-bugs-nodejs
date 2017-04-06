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
Object.defineProperty(exports, "__esModule", { value: true });
var launcher_1 = require("/Users/willyelm/Github/atom-bugs-chrome-debugger/lib/launcher");
var path_1 = require("path");
var NodeLauncher = (function (_super) {
    __extends(NodeLauncher, _super);
    function NodeLauncher() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NodeLauncher.prototype.normalizePath = function (dir) {
        return dir.replace(/^~/, process.env.HOME);
    };
    NodeLauncher.prototype.getLauncherArguments = function () {
        return [
            "--inspect",
            "--debug-brk=" + this.portNumber,
            this.normalizePath(this.scriptPath)
        ].concat(this.launchArguments);
    };
    NodeLauncher.prototype.getProcessOptions = function () {
        return {
            detached: true,
            shell: true,
            cwd: this.cwd || this.normalizePath(path_1.dirname(this.scriptPath)),
            env: this.environmentVariables
        };
    };
    NodeLauncher.prototype.getBinaryPath = function () {
        return this.binaryPath;
    };
    return NodeLauncher;
}(launcher_1.ChromeDebuggingProtocolLauncher));
exports.NodeLauncher = NodeLauncher;
//# sourceMappingURL=node-launcher.js.map