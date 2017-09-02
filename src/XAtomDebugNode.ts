'use babel';
/*!
 * XAtom Debug
 * Copyright(c) 2017 Williams Medina <williams.medinaa@gmail.com>
 * MIT Licensed
 */
const { BufferedProcess, CompositeDisposable, Disposable } = require('atom');
import { NodeDebugger } from './NodeDebugger';
import { get } from 'lodash';
// import { NodeLauncher } from './NodeLauncher';

export class XAtomDebugNode {
  public name: string = 'Node.js';
  public iconPath = 'atom://xatom-debug-nodejs/icons/nodejs.svg';

  private provider: any;
  private session: any;
  private launcher: any;
  private process: any;

  private debugger = new NodeDebugger();
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
  run () {
    this.stop();
    const options = this.session.getScheme();
    const host = '0.0.0.0';
    const port = 9000;
    console.log('scheme options', options);
    this.session.status({
      text: `Launching Node.js...`,
      loading: true
    });
    this.process = this.launcher.start('node', [
      `--inspect-brk=${host}:${port}`,
      options.currentPath
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
        this.session.status({
          text: 'Running on Node.js',
          loading: false,
          type: 'success'
        });
        // Set current breakpoints
        const breakpoints = this.session.getBreakpoints();
        // await breakpoints
        //   .map((b) => this.addBreakpoint(b))
        //   .reduce((r, i) => r.then(i), Promise.resolve());
        // Start debugging session
        this.session.start();
        this.subscriptions = new CompositeDisposable(
          this.debugger.onDidPause(() => {
            this.session.pause();
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
          this.debugger.onDidPauseOnLocation((location) => {
            this.session.location(location)
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
