'use babel';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _a = require('atom'), BufferedProcess = _a.BufferedProcess, CompositeDisposable = _a.CompositeDisposable, Disposable = _a.Disposable, Emitter = _a.Emitter;
var Launcher = (function () {
    function Launcher() {
        this.emitter = new Emitter();
    }
    Launcher.prototype.onDidExit = function (cb) {
        return this.emitter.on('didExit', cb);
    };
    Launcher.prototype.start = function (command, args, options) {
        var _this = this;
        this.process = new BufferedProcess({
            command: command,
            args: args,
            stdout: function (output) {
                console.log(output);
            },
            stderr: function (output) {
                console.log(output);
            },
            exit: function (code) { return _this.end(code); }
        });
    };
    Launcher.prototype.end = function (code) {
        if (this.process) {
            this.process.kill();
        }
        this.emitter.emit('onDidExit', code);
    };
    return Launcher;
}());
exports.Launcher = Launcher;
//# sourceMappingURL=NodeLauncher.js.map