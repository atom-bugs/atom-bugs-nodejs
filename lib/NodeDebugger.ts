'use babel';

// const path = require('path')
// const EventEmitter = require('events')
import { spawn } from 'child_process';
import { EventEmitter }  from 'events';
import { DebuggerProtocolClient }  from './DebuggerProtocolClient';

export class NodeDebugger extends EventEmitter {

  private childProcess: any;

  public protocol: DebuggerProtocolClient = new DebuggerProtocolClient();
  public scriptPath: string;
  public binary: string = '/usr/local/bin/node';
  public portNumber: number = 5858;

  public stopScript () {
    return new Promise<boolean>((resolve) => {
      this.childProcess.kill();
      this.protocol.disconnect();
      resolve(true);
    })
  }

  public buildCallStack () {
    let callStack = this.protocol.getCallStack();
    return callStack.map((frame) => {
      return {
        name: frame.functionName,
        columnNumber: frame.location.columnNumber,
        lineNumber: frame.location.lineNumber,
        filePath: frame.location.script.url
      };
    });
  }

  async executeScript () {
    let args = [
      `--inspect`,
      `--debug-brk=${this.portNumber}`,
      this.scriptPath
    ]
    // kill if already running
    if (this.childProcess) {
      await this.stopScript();
    }
    // process
    this.childProcess = spawn(this.binary, args)
    this.childProcess.stdout.on('data', (res) => this.emit('data', res))
    this.childProcess.stderr.on('data', (res) => {
      if (String(res).match(/Waiting for the debugger to disconnect\.\.\./gi)) {
        this.emit('close');
      }
      this.emit('data', res);
    })
    this.childProcess.stdout.on('end', (res) => this.emit('data', res))
    this.childProcess.stderr.on('end', (res) => this.emit('data', res))
    this.childProcess.on('close', (code) => this.emit('close', code))
    this.protocol.reset();
    return this.protocol.connect('localhost', this.portNumber);
  }
}
