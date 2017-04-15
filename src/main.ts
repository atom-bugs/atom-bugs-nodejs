import { NodePlugin } from './plugin/node-plugin'
const { CompositeDisposable, Disposable } = require('atom')

module.exports = {
  pluginManager: null,
  plugin: null,
  registerPlugin (pluginManager) {
    this.plugin = new NodePlugin()
    this.pluginManager = pluginManager
    this.pluginManager.addPlugin(this.plugin)
  },
  activate () {
    require('atom-package-deps').install('xatom-debug-nodejs', true)
  },
  deactivate () {
    if (this.plugin) {
      this.plugin.didStop()
    }
    if (this.pluginManager) {
      this.pluginManager.removePlugin(this.plugin)
    }
  }
}
