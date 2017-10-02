'use babel';
/*!
 * XAtom Debug
 * Copyright(c) 2017 Williams Medina <williams.medinaa@gmail.com>
 * MIT Licensed
 */
const { BufferedProcess, CompositeDisposable, Disposable } = require('atom');
import { Debugger } from './Debugger';
import { get } from 'lodash';

export class XAtomDebugNode {
  public name: string = 'Node.js';
  public iconPath = 'atom://xatom-debug-nodejs/icons/nodejs.svg';

  private provider: any;
  private session: any;
  private launcher: any;
  private process: any;

  private debugger = new Debugger();
  private subscriptions: any;

  activate () {
    require('atom-package-deps').install('xatom-debug', true);
  }
  deactivate () {
    if (this.provider) {
      this.provider.removePlugin(this.name);
      this.stop();
    }
  }
  async run () {
    this.stop();
    const options = await this.session.getControlOptions();
    const scheme = await this.session.getSchemeOptions();
    const host = '0.0.0.0';
    const port = 9000;
    console.log('options', options, scheme);
    this.session.status({
      text: `Launching Node.js...`,
      loading: true
    });
    this.process = this.launcher.start('node', [
      `--inspect=${host}:${port} --debug-brk`,
      scheme.currentPath
    ]);
    this
      .debugger
      .attach(host, port)
      .catch((e) => {
        this.session.status({
          text: 'Unable to attach debugger',
          loading: false,
          type: 'error'
        });
        this.launcher.end();
      })
      .then(async (domains) => {
        if (options.pauseOnException) {
          await this.debugger.setPauseOnExceptions('all');
        }
        await this.debugger.setBreakpointsActive(!options.disableBreakpoints);
        this.session.status({
          text: 'Running on Node.js',
          loading: false,
          type: 'success'
        });
        // Set current breakpoints
        const breakpoints = await this.session.getBreakpoints();
        // Start debugging session
        this.session.start();
        this.subscriptions = new CompositeDisposable(
          this.debugger.onDidPause(async (params) => {
            // if (params.reason === 'Break on start') {
            //   this.continue();
            // } else {
              this.session.pause();
              const callFrames = [];
              // const location = <any> get(params, 'callFrames[0].location', null);
              // build frames
              get(params, 'callFrames', [])
                .map((frame, index) => {
                  const frameLocation: any = get(frame, 'location', {});
                  return this
                    .debugger
                    .getScript((script) => {
                      return script.scriptId === frameLocation.scriptId;
                    })
                    .then((script) => {
                      const originalLocation = this.debugger.getScriptOriginalLocation(script,
                        frameLocation.lineNumber,
                        frameLocation.columnNumber);
                      callFrames.push({
                        filePath: originalLocation.filePath,
                        functionName: frame.functionName,
                        lineNumber: originalLocation.lineNumber,
                        columnNumber: originalLocation.columnNumber
                      });
                      if (index === 0) {
                        if (params.reason === 'exception') {
                          this.session.markException(originalLocation);
                        } else {
                          this.session.markLocation(originalLocation);
                        }
                      }
                    })
                    .catch((e) => {
                      console.log('1 unable to get script', frameLocation.scriptId);
                    })
                })
                .reduce((r, v: any) => r.then(v), Promise.resolve())
                .then(() => this.session.setFrames(callFrames));
            // }
          }),
          this.debugger.onDidResume(() => {
            this.session.resume();
          }),
          this.debugger.onDidLoadFile((filePath) => {
            const breakpoint = breakpoints.find((b) => {
              return filePath === b.filePath;
            });
            if (breakpoint) {
              this.addBreakpoint(breakpoint);
            }
          }),
          this.debugger.onDidException((params) => {
            this.session.resume();
            const error = get(params, 'exceptionDetails.text', 'Uncaught');
            const description = get(params, 'exceptionDetails.exception.description', 'Exception');
            this.session.status({
              text: `${error} ${description}`,
              loading: false,
              type: 'error'
            });
          })
        )
      });
  }
  stop () {
    if (this.process) this.process.kill();
    this.debugger.dettach();
    this.session.status({
      text: 'Finished running on Node.js',
      loading: false,
      type: 'warning'
    });
    this.session.end();
    if (this.subscriptions) {
      this.subscriptions.dispose();
    }
  }
  addBreakpoint (breakpoint) {
    return this.debugger.addBreakpoint(breakpoint);
  }
  removeBreakpoint (breakpoint) {
    return this.debugger.removeBreakpoint(breakpoint);
  }
  continue () {
    this.debugger.resume();
  }
  pause () {
    this.debugger.pause();
  }
  stepOver () {
    this.debugger.stepOver();
  }
  stepInto () {
    this.debugger.stepInto();
  }
  stepOut () {
    this.debugger.stepOut();
  }
  registerPlugin (provider) {
    this.provider = provider;
    this.session = provider.getSession();
    this.launcher = provider.getLauncher();
    provider.addPlugin(this.name, this);
  }
}

module.exports = new XAtomDebugNode();
