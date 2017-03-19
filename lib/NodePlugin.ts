'use babel';

import { NodeDebugger } from './NodeDebugger';

export class NodePlugin {

  private debugger: NodeDebugger;
  private client: any;

  public name: String = 'Node.js';
  public iconPath: String = 'atom://atom-bugs-nodejs/icons/nodejs.svg';
  public options: Object = {
    binaryPath: {
      type: 'text',
      name: 'Binary Path',
      value: '/usr/bin/local/node'
    }
  }

  constructor () {
    this.debugger = new NodeDebugger();
    this.debugger.on('data', (message) => {
      console.log(String(message));
    });
    this.debugger.protocol.on('console', (params) => {
      params.args.forEach((a) => {
        switch (a.type) {
          case 'string': {
            this.client.console[params.type](a.value);
          }; break;
          default:
            console.log('console called', params)
        }
      })
    })
    this.debugger.protocol.on('start', () => {
      // apply breakpoints
      let breaks = this.client.getBreakpoints();
      breaks.forEach((b) => {
        let {filePath, lineNumber} = b;
        this.didAddBreakpoint(filePath, lineNumber);
      })
    });
    this.debugger.protocol.on('close', (message) => {
      // set status to stop
      this.client.stop();
    });
    this.debugger.protocol.on('pause', (params) => {
      if (params.hitBreakpoints && params.hitBreakpoints.length > 0) {
        params.hitBreakpoints.forEach(async (id) => {
          let breakpoint = await this.debugger.protocol.getBreakpointById(id);
          this.client.activateBreakpoint(breakpoint.url, breakpoint.lineNumber);
        })
      }
      console.log('pause', this.debugger.protocol.getCallStack());
      // set status to pause
      this.client.pause();
    });
    this.debugger.protocol.on('resume', () => {
      // set status to resume
      this.client.resume();
    });
  }

  registerClient (atomBugsClient) {
    this.client = atomBugsClient;
  }

  // Actions
  didRun (setup) {
    this.client.console.clear();
    this.debugger.scriptPath = setup.currentFile;
    this.debugger
      .executeScript()
      .then(() => {
        this.client.run();
      });
  }
  didStop () {
    this.client.console.clear();
    this.debugger
      .stopScript()
      .then(() => {
        this.client.stop();
      });
  }
  didResume () {
    this.debugger.protocol.resume();
  }
  didPause () {
    this.debugger.protocol.pause();
  }
  didAddBreakpoint (filePath, fileNumber) {
    if (this.debugger.protocol.isConnected()) {
      this.debugger.protocol.addBreakpoint(filePath, fileNumber);
    }
  }
  didRemoveBreakpoint (filePath, fileNumber) {
    if (this.debugger.protocol.isConnected()) {
      this.debugger.protocol.removeBreakpoint(filePath, fileNumber);
    }
  }

  didStepOver () {
    this.debugger.protocol.stepOver();
  }

  didStepInto () {
    this.debugger.protocol.stepInto();
  }

  didStepOut () {
    this.debugger.protocol.stepOut();
  }

  async didEvaluateExpression (expression: string, range) {
    let connected = this.debugger.protocol.isConnected();
    if (connected) {
      let result = await this.debugger.protocol.evaluate(expression);
      if (result) {
        this.client.showEvaluation(result, range);
      }
    }
  }
}
