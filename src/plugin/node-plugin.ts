import { ChromeDebuggingProtocolPlugin } from 'xatom-debug-chrome-base/lib/plugin'

import { NodeLauncher } from './node-launcher'
import { NodeDebugger } from './node-debugger'
import { Runtype, NodeOptions } from './node-options'

import { watch, FSWatcher } from 'chokidar'
import { resolve as resolvePath, normalize } from 'path'
import { get, isUndefined, isString } from 'lodash'

export class NodePlugin extends ChromeDebuggingProtocolPlugin {

  public options: Object = NodeOptions
  public name: String = 'Node.js'
  public iconPath: String = 'atom://xatom-debug-nodejs/icons/nodejs.svg'
  public launcher: NodeLauncher = new NodeLauncher()
  public debugger: NodeDebugger = new NodeDebugger()

  private watcher: FSWatcher

  constructor () {
    super()
    this.addEventListeners()
  }

  didLaunchError (message: string) {
    atom.notifications.addError('XAtom Debug: Node.js', {
      detail: `Launcher error: ${message}`,
      dismissable: true
    })
  }

  async start (options: any) {
    try {
      let projectPath = this.pluginClient.getPath()
      let socketUrl
      this.debugger.skipFirstPause = true
      switch (options.runType) {
        case Runtype.CurrentFile:
        case Runtype.Script:
          if (options.runType === Runtype.CurrentFile) {
            let editor = atom.workspace.getActiveTextEditor()
            if (!isUndefined(editor)) {
              this.launcher.scriptPath = await this.normalizePath(editor.getPath())
            }
          } else {
            this.launcher.scriptPath = await this.normalizePath(options.scriptPath)
            this.launcher.cwd = await this.normalizePath(projectPath, true)
          }
          if (isString(this.launcher.scriptPath)) {
            this.launcher.binaryPath = await this.normalizePath(options.binaryPath, true)
            this.launcher.portNumber = options.port
            this.launcher.launchArguments = options.launchArguments
            this.launcher.environmentVariables = options.environmentVariables
            socketUrl = await this.launcher.start()
          }
          break
        case Runtype.Remote:
          this.launcher.hostName = options.remoteUrl
          this.launcher.portNumber = options.remotePort
          socketUrl = await this.launcher.getSocketUrl()
          break
      }
      if (socketUrl) {
        this.pluginClient.run()
        this.pluginClient.status.update('Connecting to debugger')
        await this
          .debugger
          .connect(socketUrl)
          .then(() => {
            this.pluginClient.status.update('Debugger attached', 'status-success')
            this.pluginClient.status.stopLoading()
          })
      }
    } catch (e) {
      this.pluginClient.status.update(e, 'status-error')
      this.pluginClient.status.stopLoading()
    }
  }

  async restart (options) {
    await this.didStop()
    this.pluginClient.status.startLoading()
    this.pluginClient.status.update('Restarting to debugger')
    return this.start(options)
  }

  // Actions
  async didRun () {
    this.pluginClient.status.startLoading()
    this.pluginClient.status.update('Running node')
    this.pluginClient.console.clear()
    let options = await this.pluginClient.getOptions()
    let projectPath = this.pluginClient.getPath()
    if (this.watcher) {
      this.watcher.close()
    }
    if (options.restartOnChanges) {
      this.watcher = watch(resolvePath(projectPath, options.changesPattern || ''), {
        ignored: [
          /[\/\\]\./,
          /node_modules/,
          /bower_components/
        ]
      })
      this
        .watcher
        .on('change', () => this.restart(options))
        .on('unlink', () => this.restart(options))
    }
    return this.start(options)
  }
}
