'use babel';

import { NodePlugin } from './NodePlugin';
const { CompositeDisposable, Disposable } = require('atom');

export default {
  pluginManager: null,
  plugin: null,
  consumeBugsService (pluginManager) {
    this.plugin = new NodePlugin();
    this.pluginManager = pluginManager;
    this.pluginManager.addPlugin(this.plugin);
  },
  activate () {
    require('atom-package-deps').install('atom-bugs-nodejs', true);
  },
  deactivate () {
    if (this.bugs) {
      this.pluginManager.removePlugin(this.plugin);
    }
  }
};
