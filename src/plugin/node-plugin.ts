import { ChromeDebuggingProtocolPlugin } from 'atom-bugs-chrome-debugger/lib/plugin'

import { NodeLauncher } from './node-launcher'
import { NodeDebugger } from './node-debugger'
import { Runtype, NodeOptions } from './node-options'

import { watch, FSWatcher } from 'chokidar'
import { resolve } from 'path'
import { get, isUndefined, isString } from 'lodash'

export class NodePlugin extends ChromeDebuggingProtocolPlugin {

  public options: Object = NodeOptions
  public name: String = 'Node.js'
  public iconPath: String = 'atom://atom-bugs-nodejs/icons/nodejs.svg'
  public launcher: NodeLauncher = new NodeLauncher()
  public debugger: NodeDebugger = new NodeDebugger()

  private watcher: FSWatcher

  constructor () {
    super()
    this.addEventListeners()
  }

  didLaunchError (message: string) {
    atom.notifications.addError('Atom Bugs: Node.js', {
      detail: `Launcher error: ${message}`,
      dismissable: true
    })
  }

  async start (options: any) {
    this.pluginClient.status.startLoading()
    this.pluginClient.status.update('Running Node')
    let projectPath = this.pluginClient.getPath()
    let socketUrl
    this.debugger.skipFirstPause = true
    switch (options.runType) {
      case Runtype.CurrentFile:
      case Runtype.Script:
        if (options.runType === Runtype.CurrentFile) {
          let editor = atom.workspace.getActiveTextEditor()
          if (!isUndefined(editor)) {
            this.launcher.scriptPath = editor.getPath()
          }
        } else {
          this.launcher.scriptPath = options.scriptPath
          this.launcher.cwd = projectPath
        }
        if (isString(this.launcher.scriptPath)) {
          this.launcher.binaryPath = options.binaryPath
          this.launcher.portNumber = options.port
          this.launcher.launchArguments = options.launchArguments
          this.launcher.environmentVariables = options.environmentVariables
          socketUrl = await this.launcher.start()
        }
        break
      case Runtype.Remote:
        this.launcher.hostName = options.remoteUrl
        this.launcher.portNumber = options.remotePort
        socketUrl = await this
          .launcher
          .getSocketUrl()
          .then(() => {
            this.pluginClient.status.update('Connecting to Debugger')
          })
        break
    }
    if (socketUrl) {
      this.pluginClient.run()
      await this
        .debugger
        .connect(socketUrl)
        .catch((e) => {
          console.log('e', e)
        })
        .then(() => {
          this.pluginClient.status.update('Debugger Attached')
          this.pluginClient.status.stopLoading()
        })
    } else {
      this.pluginClient.status.update('Unable to start protocol')
      this.pluginClient.status.stopLoading()
    }
  }

  async restart (options) {
    await this.didStop()
    this.pluginClient.status.update('Restarting to Debugger')
    return this.start(options)
  }

  // Actions
  async didRun () {
    this.pluginClient.console.clear()
    let options = await this.pluginClient.getOptions()
    let projectPath = this.pluginClient.getPath()
    if (this.watcher) {
      this.watcher.close()
    }
    if (options.restartOnChanges) {
      this.watcher = watch(resolve(projectPath, options.changesPattern || ''), {
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
