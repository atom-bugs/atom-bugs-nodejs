"use strict";
exports.__esModule = true;
var node_1 = require("./node");
var _a = require('atom'), CompositeDisposable = _a.CompositeDisposable, Disposable = _a.Disposable;
module.exports = {
    bugs: null,
    plugin: new node_1.NodeBugsPlugin(),
    consumeBugsService: function (bugs) {
        this.bugs = bugs;
        this.bugs.addPlugin(this.plugin);
    },
    activate: function () {
        require('atom-package-deps').install('atom-bugs-nodejs', true);
    },
    deactivate: function () {
        if (this.bugs) {
            this.bugs.removePlugin(this.plugin);
        }
    }
};
//# sourceMappingURL=main.js.map