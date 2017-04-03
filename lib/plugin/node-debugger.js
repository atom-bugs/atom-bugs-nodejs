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
var debugger_1 = require("atom-bugs-chrome-debugger/lib/debugger");
var NodeDebugger = (function (_super) {
    __extends(NodeDebugger, _super);
    function NodeDebugger() {
        return _super.call(this) || this;
    }
    NodeDebugger.prototype.getFeatures = function () {
        var _a = this.domains, Profiler = _a.Profiler, Runtime = _a.Runtime, Debugger = _a.Debugger, Page = _a.Page;
        return [
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
        ];
    };
    return NodeDebugger;
}(debugger_1.ChromeDebuggingProtocolDebugger));
exports.NodeDebugger = NodeDebugger;
//# sourceMappingURL=node-debugger.js.map