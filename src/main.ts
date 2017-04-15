import { NodePlugin } from './plugin/node-plugin'
const { CompositeDisposable, Disposable } = require('atom')
const { install } = require('atom-package-deps')

module.exports = {
  pluginManager: null,
  plugin: null,
  registerPlugin (pluginManager) {
    this.plugin = new NodePlugin()
    this.pluginManager = pluginManager
    this.pluginManager.addPlugin(this.plugin)
  },
  activate () {
    install('xatom-debug-nodejs', true)
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
