'use babel';
/*!
 * XAtom Debug
 * Copyright(c) 2017 Williams Medina <williams.medinaa@gmail.com>
 * MIT Licensed
 */
const { Emitter, CompositeDisposable } = require('atom');
const { SourceMapConsumer } = require('source-map');
import { parse as pathParse, resolve as pathResolve, join } from 'path';
import { readFile, stat } from 'fs';
import { request } from 'http';
import { get } from 'lodash';
import { ConsoleMessage, Domains, ChromeDebuggingProtocol }  from 'chrome-debugging-protocol';

export class Debugger {
  public protocol: ChromeDebuggingProtocol;
  public isRunning: boolean;
  private emitter = new Emitter();
  private scripts: any[] = [];
  private breakpoints: any[] = [];
  private sourcemaps: any[] = [];
  constructor () {}
  onDidPause (cb) {
    return this.emitter.on('didPause', cb);
  }
  onDidPauseOnLocation (cb) {
    return this.emitter.on('didPauseOnLocation', cb);
  }
  onDidResume (cb) {
    return this.emitter.on('didResume', cb);
  }
  onDidException (cb) {
    return this.emitter.on('didException', cb);
  }
  onDidAddScript (cb) {
    return this.emitter.on('didAddScript', cb);
  }
  onDidLoadFile (cb) {
    return this.emitter.on('didLoadFile', cb);
  }
  getScriptOriginalLocation (script: any, lineNumber: number, columnNumber?: number) {
    const fileLocation = {
      filePath: script.url,
      lineNumber: lineNumber,
      columnNumber: columnNumber || 0
    };
    if (script.sourcemapConsumer) {
      let sourceLocation = {
        line: lineNumber + 1,
        column: columnNumber || 0,
        bias: SourceMapConsumer.LEAST_UPPER_BOUND
      }
      let position = script.sourcemapConsumer.originalPositionFor(sourceLocation)
      if (position.source === null) {
        sourceLocation.bias = SourceMapConsumer.GREATEST_LOWER_BOUND
        position = script.sourcemapConsumer.originalPositionFor(sourceLocation)
      }
      if (position.source) {
        fileLocation.filePath = position.source;
        fileLocation.lineNumber = position.line - 1;
        fileLocation.columnNumber = position.column;
      }
    }
    return fileLocation;
  }
  // getGeneratedLocation (location) {
  //   console.log('generated', location);
  // }
  getScript (cb) {
    return new Promise((resolve, reject) => {
      let script = this.scripts.find(cb);
      if (script) {
        resolve(script);
      } else {
        let handler;
        const disposable = this.emitter.on('didAddScript', (script) => {
          if (cb(script)) {
            clearTimeout(handler);
            resolve(script);
          }
        });
        handler = setTimeout(() => {
          disposable.dispose();
          reject('Unable to get script');
        }, 5000);
      }
    })
  }
  setup (): Promise<any> {
    var { Profiler, Runtime, Debugger, Page } = this.protocol.getDomains();
    Debugger.scriptParsed((params) => {
      this.addScript(params);
    });
    Debugger.paused(async (params) => {
      this.emitter.emit('didPause', params);
    });
    Debugger.resumed((params) => {
      this.emitter.emit('didResume');
    });
    Runtime.exceptionThrown((params) => {
      this.emitter.emit('didException', params);
    });
    Runtime.consoleAPICalled((params) => {
      console.log('consoleAPICalled', params);
    });
    return Promise.all([
      Runtime.enable(),
      Debugger.enable(),
      Debugger.setPauseOnExceptions({ state: 'none' }),
      Debugger.setAsyncCallStackDepth({ maxDepth: 0 }),
      Debugger.setBreakpointsActive({
        active: true
      }),
      Profiler.enable(),
      Profiler.setSamplingInterval({ interval: 100 }),
      Debugger.setBlackboxPatterns({ patterns: [] }),
      Runtime.runIfWaitingForDebugger()
    ]);
  }
  setPauseOnExceptions (state: string) {
    const { Debugger } = this.protocol.getDomains();
    return Debugger.setPauseOnExceptions({ state });
  }
  setBreakpointsActive (active: boolean) {
    const { Debugger } = this.protocol.getDomains();
    return Debugger.setBreakpointsActive({ active });
  }
  async addSourceMap (params: any) {
    const scriptUrl = pathParse(params.url);
    const isBase64 = params.sourceMapURL.match(/^data\:application\/json\;(charset=.+)?base64\,(.+)$/);
    let sourceMapContent = '';
    if (isBase64) {
      sourceMapContent = Buffer.from(isBase64[2], 'base64').toString();
    } else {
      sourceMapContent = await new Promise<string>((resolve, reject) => {
        const sourceMapPath = pathResolve(scriptUrl.dir, params.sourceMapURL);
        readFile(sourceMapPath, (err, data) => {
          if (err) return reject(err);
          resolve(data.toString());
        })
      });
    }
    const sourceMapObject = await new Promise<any>((resolve, reject) => {
      try {
        resolve(JSON.parse(sourceMapContent));
      } catch (e) {
        reject(e);
      }
    });
    sourceMapObject.file = params.url;
    sourceMapObject.sources = sourceMapObject.sources.map((filePath) => {
      const sourcePath = pathResolve(scriptUrl.dir, sourceMapObject.sourceRoot, filePath);
      this.loadScript(sourcePath);
      return sourcePath;
    });
    const consumer = new SourceMapConsumer(sourceMapObject);
    this.sourcemaps.push(consumer);
    return consumer;
  }
  async loadScript (fileUrl: string) {
    const fileExists = await new Promise<boolean>((resolve) => {
      stat(fileUrl, (err) => resolve(err ? false : true));
    });
    if (fileExists) {
      this.emitter.emit('didLoadFile', fileUrl);
    }
  }
  async addScript (script) {
    if (script.sourceMapURL) {
      script.sourcemapConsumer = await this.addSourceMap(script);
    }
    this.scripts.push(script);
    this.emitter.emit('didAddScript', script);
    this.loadScript(script.url);
  }
  requestIfRunning (cb): Promise<any> {
    if (this.isRunning) {
      return cb(this.protocol.getDomains());
    }
    return Promise.resolve();
  }
  addBreakpoint (breakpoint) {
    return this.requestIfRunning(async ({ Debugger }) => {
      const script = this.scripts.find((script) => {
        return script.url === breakpoint.filePath
      });
      const breakpointLocation = {
        url: breakpoint.filePath,
        lineNumber: breakpoint.lineNumber - 1,
        columnNumber: breakpoint.columnNumber || 0
      };
      if (!script) {
        const consumer = this.sourcemaps.find((s) => {
          return s.sources.includes(breakpoint.filePath);
        });
        if (consumer) {
          let fileLocation = {
            source: breakpoint.filePath,
            line: breakpoint.lineNumber,
            column: breakpoint.columnNumber || 0,
            bias: SourceMapConsumer.LEAST_UPPER_BOUND
          }
          let position = consumer.generatedPositionFor(fileLocation)
          if (position.line === null) {
            fileLocation.bias = SourceMapConsumer.GREATEST_LOWER_BOUND
            position = consumer.generatedPositionFor(fileLocation)
          }
          if (position) {
            breakpointLocation.url = consumer.file;
            breakpointLocation.lineNumber = position.line - 1;
            breakpointLocation.columnNumber = position.column;
          }
        }
      }
      return Debugger
        .setBreakpointByUrl(breakpointLocation)
        .then((params) => {
          this.breakpoints.push(Object.assign(params, breakpoint));
        });
    });
  }
  removeBreakpoint (breakpoint) {
    return this.requestIfRunning(({ Debugger }) => {
      const item = this.breakpoints.find((b) => {
        return b.filePath === breakpoint.filePath &&
          b.lineNumber === breakpoint.lineNumber &&
          b.columnNumber === breakpoint.columnNumber;
      });
      if (item) {
        return Debugger
          .removeBreakpoint({
            breakpointId: item.breakpointId
          })
          .then(() => {
            const index = this.breakpoints.indexOf(item);
            this.breakpoints.splice(index, 1);
          });
      }
      return Promise.resolve();
    });
  }
  resume () {
    return this.requestIfRunning(({ Debugger }) => {
      return Debugger.resume();
    });
  }
  pause () {
    return this.requestIfRunning(({ Debugger }) => {
      return Debugger.pause();
    });
  }
  stepOver () {
    return this.requestIfRunning(({ Debugger }) => {
      return Debugger.stepOver();
    });
  }
  stepInto () {
    return this.requestIfRunning(({ Debugger }) => {
      return Debugger.stepInto();
    });
  }
  stepOut () {
    return this.requestIfRunning(({ Debugger }) => {
      return Debugger.stepOut();
    });
  }
  async attach (
    hostname: string,
    port: number): Promise<boolean> {
    const sockets = await this
      .getSockets(hostname, port, 5)
      .catch((error) => {
        throw new Error(error);
      });
    if (sockets && sockets.length > 0) {
      const socket = sockets[0];
      this.protocol = new ChromeDebuggingProtocol(socket.webSocketDebuggerUrl);
      await this.protocol.connect();
      await this.setup().then(() => {
        this.isRunning = true;
      });
    }
    return false;
  }
  dettach () {
    if (this.protocol) {
      this.protocol.disconnect();
      this.protocol = undefined;
      this.isRunning = false;
      this.sourcemaps = [];
      this.scripts = [];
      this.breakpoints = [];
    }
  }
  getSockets (hostname: string, port: number, attempts?: number) {
    return new Promise<any>((resolve, reject) => {
      const errorHandler = (e) => {
        if (attempts && attempts > 0) {
          attempts--;
          setTimeout(() => resolve(this.getSockets(hostname, port, attempts)), 500);
        } else {
          reject(e);
        }
      }
      let req = request({
        hostname,
        port,
        path: '/json',
        method: 'GET'
      }, (res) => {
        res.setEncoding('utf8')
        res.on('data', (chunk) => {
          try {
            const json = JSON.parse(chunk.toString());
            resolve(json.filter((page) => page.webSocketDebuggerUrl));
          } catch (e) {
            errorHandler(e)
          }
        })
      })
      req.on('error', errorHandler);
      req.end();
    })
  }
}
