"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_plugin_1 = require("./plugin/node-plugin");
var _a = require('atom'), CompositeDisposable = _a.CompositeDisposable, Disposable = _a.Disposable;
module.exports = {
    pluginManager: null,
    plugin: null,
    registerPlugin: function (pluginManager) {
        this.plugin = new node_plugin_1.NodePlugin();
        this.pluginManager = pluginManager;
        this.pluginManager.addPlugin(this.plugin);
    },
    activate: function () {
        require('atom-package-deps').install('xatom-debug-nodejs', true);
    },
    deactivate: function () {
        if (this.plugin) {
            this.plugin.didStop();
        }
        if (this.pluginManager) {
            this.pluginManager.removePlugin(this.plugin);
        }
    }
};
//# sourceMappingURL=main.js.map