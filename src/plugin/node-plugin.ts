import { ChromeDebuggingProtocolPlugin } from 'atom-bugs-chrome-debugger/lib/plugin'

import { NodeLauncher } from './node-launcher'
import { NodeDebugger } from './node-debugger'
import { Runtype, NodeOptions } from './node-options'

export class NodePlugin extends ChromeDebuggingProtocolPlugin {

  public options: Object = NodeOptions
  public name: String = 'Node.js'
  public iconPath: String = 'atom://atom-bugs-nodejs/icons/nodejs.svg'
  public launcher: NodeLauncher = new NodeLauncher()
  public debugger: NodeDebugger = new NodeDebugger()

  constructor () {
    super()
    this.addEventListeners()
  }

  // Actions
  async didRun () {
    this.pluginClient.console.clear()
    let options = await this.pluginClient.getOptions()
    switch (options.runType) {
      case Runtype.CurrentFile:
      case Runtype.Script:
        if (options.runType === Runtype.CurrentFile) {
          let editor = atom.workspace.getActiveTextEditor()
          this.launcher.scriptPath = editor.getPath()
        } else {
          this.launcher.scriptPath = options.scriptPath
          this.launcher.cwd = this.pluginClient.getPath()
        }
        this.pluginClient.console.info(`Starting Debugger on port ${options.port}`)
        this.pluginClient.console.info(`Running script: ${this.launcher.scriptPath}`)
        this.launcher.binaryPath = options.binaryPath
        this.launcher.portNumber = options.port

        this.launcher.launchArguments = options.launchArguments
        this.launcher.environmentVariables = options.environmentVariables
        let scriptSocketUrl = await this.launcher.start()
        this.pluginClient.run()
        this.debugger.connect(scriptSocketUrl)
        break
      case Runtype.Remote:
        this.launcher.hostName = options.remoteUrl
        this.launcher.portNumber = options.remotePort
        let remoteSocketUrl = await this.launcher.getSocketUrl()
        this.pluginClient.run()
        this.debugger.connect(remoteSocketUrl)
        break
    }
  }
}
