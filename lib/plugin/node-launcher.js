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
var launcher_1 = require("xatom-debug-chrome-base/lib/launcher");
var path_1 = require("path");
var lodash_1 = require("lodash");
var NodeLauncher = (function (_super) {
    __extends(NodeLauncher, _super);
    function NodeLauncher() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NodeLauncher.prototype.normalizePath = function (dir) {
        return path_1.normalize(dir.replace(/^~/, process.env.HOME));
    };
    NodeLauncher.prototype.getLauncherArguments = function () {
        var fileTarget = this.normalizePath(lodash_1.get(this, 'scriptPath', ''));
        var launcherArgs = [
            "--inspect",
            "--debug-brk=" + this.portNumber,
            "\"" + fileTarget + "\""
        ].concat(this.launchArguments);
        console.log(launcherArgs);
        return launcherArgs;
    };
    NodeLauncher.prototype.getProcessOptions = function () {
        var projectPath = this.cwd || this.normalizePath(path_1.dirname(lodash_1.get(this, 'scriptPath', '')));
        var envPath = lodash_1.get(process, 'env.PATH');
        var npmPath = path_1.join(projectPath, 'node_modules', '.bin');
        return {
            shell: true,
            cwd: projectPath,
            env: lodash_1.extend({
                SHELL: lodash_1.get(process, 'env.SHELL'),
                TERM: lodash_1.get(process, 'env.TERM'),
                TMPDIR: lodash_1.get(process, 'env.TMPDIR'),
                USER: lodash_1.get(process, 'env.USER'),
                PATH: npmPath + ":" + envPath,
                PWD: lodash_1.get(process, 'env.PWD'),
                LANG: lodash_1.get(process, 'env.LANG'),
                HOME: lodash_1.get(process, 'env.HOME')
            }, this.environmentVariables)
        };
    };
    NodeLauncher.prototype.getBinaryPath = function () {
        return this.binaryPath;
    };
    return NodeLauncher;
}(launcher_1.ChromeDebuggingProtocolLauncher));
exports.NodeLauncher = NodeLauncher;
//# sourceMappingURL=node-launcher.js.map