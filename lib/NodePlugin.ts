'use babel'

import { NodeDebugger } from './NodeDebugger'
import { Runtype, NodeOptions } from './NodeOptions'

export class NodePlugin {

  private debugger: NodeDebugger
  private client: any

  public name: String = 'Node.js'
  public iconPath: String = 'atom://atom-bugs-nodejs/icons/nodejs.svg'
  public options: Object = NodeOptions

  constructor () {
    this.debugger = new NodeDebugger()
    this.debugger.on('err', (message) => {
      if (message) {
        this.client.console.info(message.toString())
      }
    })
    this.debugger.protocol.on('console', (params) => {
      params.args.forEach((a) => {
        switch (a.type) {
          case 'string': {
            this.client.console[params.type](a.value)
          } break
          default:
            console.log('console called', params)
        }
      })
    })
    this.debugger.protocol.on('start', () => {
      // apply breakpoints
      let breaks = this.client.getBreakpoints()
      breaks.forEach((b) => {
        let {filePath, lineNumber} = b
        this.didAddBreakpoint(filePath, lineNumber)
      })
    })
    this.debugger.protocol.on('close', (message) => {
      // set status to stop
      this.client.stop()
    })
    this.debugger.protocol.on('pause', (params) => {
      if (params.hitBreakpoints && params.hitBreakpoints.length > 0) {
        params.hitBreakpoints.forEach(async (id) => {
          let breakpoint = await this.debugger.protocol.getBreakpointById(id)
          this.client.activateBreakpoint(breakpoint.url, breakpoint.lineNumber)
        })
      }
      this.client.setCallStack(this.debugger.getCallStack())
      this.client.setScope(this.debugger.getScope())
      // set status to pause
      this.client.pause()
    })
    this.debugger.protocol.on('resume', () => {
      // set status to resume
      this.client.resume()
    })
  }

  register (client) {
    this.client = client
  }

  // Actions
  async didRun () {
    this.client.console.clear()
    let options = this.client.getOptions()
    switch (options.runType) {
      case Runtype.CurrentFile:
      case Runtype.Script:
        if (options.runType === Runtype.CurrentFile) {
          let editor = atom.workspace.getActiveTextEditor()
          this.debugger.scriptPath = editor.getPath()
        } else {
          this.debugger.scriptPath = options.scriptPath
          this.debugger.cwd = this.client.getPath()
        }
        this.debugger.binaryPath = options.binaryPath
        this.debugger.portNumber = options.port
        this.debugger.launchArguments = options.launchArguments
        this.debugger.environmentVariables = options.environmentVariables
        this.debugger.executeScript().then(() => {
          this.client.run()
        })
        break
      case Runtype.Remote:
        this.debugger.hostName = options.remoteUrl
        this.debugger.portNumber = options.remotePort
        this.debugger.connect().then(() => {
          this.client.run()
        })
        break
    }
  }
  didStop () {
    this.client.console.clear()
    this.debugger.stopScript().then(() => this.client.stop())
  }
  didResume () {
    this.debugger.protocol.resume()
  }
  async didPause () {
    let connected = this.debugger.protocol.isConnected()
    if (connected) {
      this.debugger.protocol.pause()
    }
  }
  didAddBreakpoint (filePath, fileNumber) {
    if (this.debugger.protocol.isConnected()) {
      this.debugger.protocol.addBreakpoint(filePath, fileNumber)
    }
  }
  didRemoveBreakpoint (filePath, fileNumber) {
    if (this.debugger.protocol.isConnected()) {
      this.debugger.protocol.removeBreakpoint(filePath, fileNumber)
    }
  }

  didStepOver () {
    this.debugger.protocol.stepOver()
  }

  didStepInto () {
    this.debugger.protocol.stepInto()
  }

  didStepOut () {
    this.debugger.protocol.stepOut()
  }

  async didRequestProperties (request, propertyView) {
    let properties: any = await this.debugger.protocol.getProperties({
      accessorPropertiesOnly: false,
      generatePreview: false,
      objectId: request.objectId,
      ownProperties: true
    })
    propertyView.insertFromDescription(properties.result) // , ...accessors.result
  }

  async didEvaluateExpression (expression: string, evaluationView) {
    let connected = this.debugger.protocol.isConnected()
    let paused = this.debugger.protocol.isPaused()
    if (connected && paused) {
      let response: any = await this
        .debugger
        .protocol
        .evaluate(expression)
        .catch((e) => {
          // do nothing
        })
      if (response) {
        let result = response.result
        if (result) {
          evaluationView.insertFromResult(result)
        }
      }
    }
  }
}
