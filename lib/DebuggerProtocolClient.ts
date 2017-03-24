'use babel';

import { request } from 'http';
import { EventEmitter }  from 'events';

export class DebuggerProtocolClient extends EventEmitter {

  private connected: boolean = false;
  private paused: boolean = false;
  private client: WebSocket;
  private nextRequestId: number = 0;
  private retry: number = 0;
  private breakpoints: Array<object> = [];
  private scripts: Array<any> = [];
  private callFrames: Array<any> = [];
  private subscriptions:{
    resolve: any,
    reject: any
  }[] = [];

  public isConnected () {
    return this.connected;
  }

  public isPaused () {
    return this.paused;
  }

  public disconnect () {
    this.client = null;
    this.paused = false;
    this.connected = false;
  }

  public send (method, params?) {
    return new Promise((resolve, reject) => {
      let requestBody = {
        id: this.nextRequestId, //(new Date().getTime()).toString(36),
        method: method
      }
      if (params) {
        requestBody['params'] = params
      }
      this.subscriptions[requestBody.id] = {
        resolve: resolve,
        reject: reject
      }
      this.client.send(JSON.stringify(requestBody));
      this.nextRequestId++;
    })
  }

  private getSocketTarget (hostname: string, port: number): Promise<string> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let req = request({
          hostname,
          port,
          path: '/json',
          method: 'GET'
        }, (res) => {
          res.setEncoding('utf8')
          res.on('data', (chunk) => {
            try {
              let targets = JSON.parse(String(chunk))
              let socketUrl = false;
              targets.forEach((target) => {
                if (target.webSocketDebuggerUrl) {
                  socketUrl = target.webSocketDebuggerUrl
                }
              })
              socketUrl ? resolve(socketUrl) : reject('Could not find socket url.');
            } catch (e) {
              reject(e);
            }
          })
        });
        req.on('error', reject);
        req.end();
      }, 500)
    })
  }

  async connect (hostname: string, port: number) {
    this.retry++;
    let target = await this
      .getSocketTarget(hostname, port)
      .then((socketUrl: string) => {
        return new Promise((resolve, reject) => {
          this.nextRequestId = 0;
          this.connected = false;
          this.client = new WebSocket(socketUrl);
          this.client.onerror = (error) => {
            this.emit('error', error);
            reject(error)
          };
          this.client.onopen = async () => {
            await Promise
              .all([
                this.send('Runtime.enable'),
                this.send('Debugger.enable'),
                this.send('Debugger.setPauseOnExceptions', { state: 'none' }),
                this.send('Debugger.setAsyncCallStackDepth', { maxDepth: 0 }),
                this.send('Profiler.enable'),
                this.send('Profiler.setSamplingInterval', { interval: 100 }),
                this.send('Debugger.setBlackboxPatterns', { patterns: [] }),
                this.send('Runtime.runIfWaitingForDebugger')
              ])
              .then(() => {
                this.connected = true;
                this.emit('start');
              })
            // await this.send('Debugger.resume');
            resolve(this.connected);
          };
          this.client.onmessage = (message: MessageEvent) => {
            let response = JSON.parse(message.data)
            if (response.id > -1 && this.subscriptions[response.id]) {
              let subscription = this.subscriptions[response.id];
              if (response.result) {
                subscription.resolve(response.result)
              } else {
                subscription.reject(response.error)
              }
            } else {
              switch (response.method) {
                case 'Debugger.paused': {
                  this.paused = true;
                  this.callFrames = response.params.callFrames;
                  this.emit('pause', response.params);
                } break;
                case 'Debugger.resumed': {
                  this.paused = false;
                  this.emit('resume', response.params);
                } break;
                case 'Debugger.scriptParsed': {
                  // do something
                  this.scripts.push(response.params);
                } break;
                case 'Runtime.consoleAPICalled': {
                  this.emit('console', response.params);
                } break;
                default:
                  console.log(response);
              }
            }
          }
          this.client.onclose = () => {
            this.emit('close');
          };
        });
      })
      .catch((message) => {
        if (this.retry === 3) {
          console.error(message);
        }
      });
    if (target) {
      return true;
    } else if (this.retry < 3) {
      return this.connect(hostname, port);
    } else {
      return false;
    }
  }

  public reset () {
    this.retry = 0;
    this.breakpoints = [];
    this.scripts = [];
    this.subscriptions = [];
  }

  public resume () {
    return this.send('Debugger.resume');
  }

  public pause () {
    return this.send('Debugger.pause');
  }

  public stepOver () {
    return this.send('Debugger.stepOver');
  }

  public stepInto () {
    return this.send('Debugger.stepInto');
  }

  public stepOut () {
    return this.send('Debugger.stepOut');
  }

  public getProperties (options) {
    return this.send('Runtime.getProperties', options);
  }

  public evaluateOnFrames (expression: string, frames: Array<any>) {
    return new Promise((resolve, reject) => {
      if (frames.length > 0) {
        let frame = frames.shift();
        if (frame && frame.callFrameId) {
          this
            .send('Debugger.evaluateOnCallFrame', {
              callFrameId: frame.callFrameId,
              expression: expression,
              generatePreview: false,
              silent: true,
              returnByValue: false,
              includeCommandLineAPI: false
            })
            .then((result: any) => {
              let lookOnParent = frames.length > 0 &&
                result.result.subtype === 'error' &&
                result.result.className !== 'SyntaxError';
              if (lookOnParent) {
                resolve(this.evaluateOnFrames(expression, frames))
              } else if (result && !result.exceptionDetails) {
                resolve(result);
              } else {
                reject(result);
              }
            });
        } else {
          reject('frame has no id');
        }
      } else {
        reject('there are no frames to evaluate');
      }
    })
  }

  public evaluate (expression: string) {
    let frames = [...(this.callFrames || [])];
    return this.evaluateOnFrames(expression, frames);
  }

  public getScriptById (scriptId: number) {
    return this.scripts.find((s) => {
      return parseInt(s.scriptId) === scriptId;
    })
  }

  public getCallStack () {
    return this.callFrames.map((frame: any) => {
      frame.location.script = this.getScriptById(parseInt(frame.location.scriptId));
      return frame;
    });
  }

  public getFrameByIndex (index: number) {
    return this.callFrames[index];
  }

  public async addBreakpoint (url: string, lineNumber: number) {
    return await this
      .send('Debugger.setBreakpointByUrl', {
        url,
        lineNumber: (lineNumber - 1)
      })
      .then((response: any) => {
        this.breakpoints.push({
          id: response.breakpointId,
          url,
          columnNumber: 0,
          lineNumber
        });
      });
  }

  public getBreakpointById (id): Promise<any> {
    return new Promise ((resolve, reject) => {
      let found = this.breakpoints.find((b: any) => {
        return (b.id === id);
      });
      resolve(found);
    })
  }

  public removeBreakpoint (url: string, lineNumber: number) {
    let breakpoint: any = this.breakpoints.find((b: any) => {
      return (b.url === url && b.lineNumber === lineNumber);
    });
    if (breakpoint) {
      return this.send('Debugger.removeBreakpoint', {
        breakpointId: breakpoint.id
      });
    }
  }
}
