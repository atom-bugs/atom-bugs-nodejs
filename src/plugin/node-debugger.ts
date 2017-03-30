'use babel'

// const path = require('path')
// const EventEmitter = require('events')
import { spawn } from 'child_process'
import { EventEmitter }  from 'events'
import { NodeDebuggerProtocol }  from '../protocol/node-debugger-protocol'
import { dirname } from 'path'

export class NodeDebugger extends EventEmitter {
  private childProcess: any
  public protocol: NodeDebuggerProtocol = new NodeDebuggerProtocol()
  public scriptPath: string
  public binaryPath: string = '/usr/local/bin/node'
  public hostName: string = 'localhost'
  public cwd: string
  public portNumber: number = 5858
  public launchArguments: Array<string> = []
  public environmentVariables: Object = {}
  public stopScript () {
    return new Promise<boolean>((resolve) => {
      this.childProcess.kill()
      this.protocol.disconnect()
      resolve(true)
    })
  }
  public getCallStack () {
    let callStack = this.protocol.getCallStack()
    return callStack.map((frame) => {
      return {
        name: frame.functionName,
        columnNumber: frame.location.columnNumber,
        lineNumber: frame.location.lineNumber,
        filePath: frame.location.script.url
      }
    })
  }
  public getScope () {
    let firstFrame = this.protocol.getFrameByIndex(0)
    let scope = [...firstFrame.scopeChain]
    if (firstFrame.this) {
      scope.unshift({
        type: 'this',
        object: firstFrame.this
      })
    }
    return scope.map((s) => {
      return {
        name: s.type,
        value: s.object
      }
    })
  }
  connect () {
    this.protocol.reset()
    return this
      .protocol
      .connect(this.hostName, this.portNumber)
      .catch((error) => {
        this.emit('error', error.toString())
      })
  }
  normalizePath (dir) {
    return dir.replace(/^~/, process.env.HOME)
  }
  async executeScript () {
    let args = [
      `--inspect`,
      `--debug-brk=${this.portNumber}`,
      this.normalizePath(this.scriptPath)
    ].concat(this.launchArguments)
    let options = {
      detached: true,
      shell: true,
      cwd: this.cwd || this.normalizePath(dirname(this.scriptPath)),
      env: this.environmentVariables
    }
    let output = ''
    // kill if already running
    if (this.childProcess) {
      await this.stopScript()
    }
    // process
    this.childProcess = spawn(this.binaryPath, args, options)
    this.childProcess.stdout.setEncoding('utf8')
    this.childProcess.stderr.setEncoding('utf8')
    this.childProcess.stdout.on('data', (res) => {
      this.emit('out', res.toString())
    })
    this.childProcess.stderr.on('data', (res) => {
      output = output.concat(res)
      this.emit('err', res)
    })
    this.childProcess.stdout.on('end', (res) => this.emit('out', res))
    this.childProcess.stderr.on('end', (res) => this.emit('err', res))
    this.childProcess.on('close', (code) => this.emit('close', code, output))
    return this.connect()
  }
}
