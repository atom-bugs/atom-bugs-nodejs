'use babel'

import { request } from 'http'
import { EventEmitter }  from 'events'
import { join, parse } from 'path'
import { readFile } from 'fs'
const { SourceMapConsumer } = require('source-map')

export interface Script {
  scriptId?: string,
  url: string,
  sourceMapURL?: string
  sourceMap?: any
}

export class NodeDebuggerProtocol extends EventEmitter {

  private connected: boolean = false
  private paused: boolean = false
  private client: WebSocket
  private nextRequestId: number = 0
  private retry: number = 0
  private breakpoints: Array<object> = []
  private scripts: Array<Script> = []
  private callFrames: Array<any> = []
  private subscriptions:{
    resolve: any,
    reject: any
  }[] = []

  public isConnected () {
    return this.connected
  }

  public isPaused () {
    return this.paused
  }

  public disconnect () {
    if (this.client) {
      this.client.close()
      this.reset()
    }
    this.client = null
    this.paused = false
    this.connected = false
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
      this.client.send(JSON.stringify(requestBody))
      this.nextRequestId++
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
              let socketUrl = false
              targets.forEach((target) => {
                if (target.webSocketDebuggerUrl) {
                  socketUrl = target.webSocketDebuggerUrl
                }
              })
              socketUrl ? resolve(socketUrl) : reject('Could not find socket url.')
            } catch (e) {
              reject(e)
            }
          })
        })
        req.on('error', reject)
        req.end()
      }, 500)
    })
  }

  async connect (hostname: string, port: number) {
    this.retry++
    let target = await this
      .getSocketTarget(hostname, port)
      .then((socketUrl: string) => {
        return new Promise((resolve, reject) => {
          this.nextRequestId = 0
          this.connected = false
          this.client = new WebSocket(socketUrl)
          this.client.onerror = (error) => {
            this.emit('error', error)
            reject(error)
          }
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
                this.connected = true
                this.emit('start')
              })
            // await this.send('Debugger.resume')
            resolve(this.connected)
          }
          this.client.onmessage = async (message: MessageEvent) => {
            let response = JSON.parse(message.data)
            if (response.id > -1 && this.subscriptions[response.id]) {
              let subscription = this.subscriptions[response.id]
              if (response.result) {
                subscription.resolve(response.result)
              } else {
                subscription.reject(response.error)
              }
            } else {
              let params = response.params
              switch (response.method) {
                case 'Debugger.paused':
                  this.paused = true
                  this.callFrames = params.callFrames
                  this.emit('pause', params)
                  break
                case 'Debugger.resumed':
                  this.paused = false
                  this.emit('resume', params)
                  break
                case 'Debugger.scriptParsed':
                  let script: Script = {
                    scriptId: params.scriptId,
                    url: params.url,
                    sourceMapURL: params.sourceMapURL
                  }
                  if (params.sourceMapURL) {
                    let sourcePath = parse(params.url)
                    let mappingPath = join(sourcePath.dir, params.sourceMapURL)
                    // script.sourceMapPath = sourcePath.dir
                    let smc = await this.getSourceMapConsumer(mappingPath)
                    script.sourceMap = {
                      getOriginalPosition (lineNumber: number, columnNumber?: number) {
                        let position = smc.originalPositionFor({
                          line: lineNumber,
                          column: columnNumber || 0
                        })
                        return {
                          url: join(sourcePath.dir, position.source),
                          lineNumber: position.line,
                          columnNumber: position.column
                        }
                      }
                    }
                    smc.sources.forEach((sourceUrl) => {
                      let mapScript: Script = {
                        // scriptId: params.scriptId,
                        url: join(sourcePath.dir, sourceUrl),
                        sourceMap: {
                          getPosition (lineNumber: number, columnNumber?: number) {
                            let position = smc.generatedPositionFor({
                              source: sourceUrl,
                              line: lineNumber,
                              column: columnNumber || 0
                            })
                            return {
                              url: params.url,
                              lineNumber: position.line
                            }
                          }
                        }
                      }
                      this.emit('scriptParse', mapScript)
                      this.scripts.push(mapScript)
                    })
                  }
                  this.emit('scriptParse', script)
                  this.scripts.push(script)
                  break
                case 'Runtime.consoleAPICalled':
                  this.emit('console', params)
                  break
                // case 'Runtime.executionContextCreated':
                //   break
                default:
                  console.log(response)
              }
            }
          }
          this.client.onclose = () => {
            this.emit('close')
          }
        })
      })
      .catch((message) => {
        if (this.retry === 3) {
          console.error(message)
        }
      })
    if (target) {
      return true
    } else if (this.retry < 3) {
      return this.connect(hostname, port)
    } else {
      return false
    }
  }

  private getSourceMapConsumer (mappingPath: string): Promise<any>  {
    return new Promise((resolve, reject) => {
      readFile(mappingPath, (err, data) => {
        if (err) {
          reject(err)
        } else {
          let rawMapping = JSON.parse(data.toString())
          let consumer = new SourceMapConsumer(rawMapping)
          resolve(consumer)
        }
      })
    })
  }

  public reset () {
    this.retry = 0
    this.breakpoints = []
    this.scripts = []
    this.subscriptions = []
  }

  public resume () {
    return this.send('Debugger.resume')
  }

  public pause () {
    return this.send('Debugger.pause')
  }

  public stepOver () {
    return this.send('Debugger.stepOver')
  }

  public stepInto () {
    return this.send('Debugger.stepInto')
  }

  public stepOut () {
    return this.send('Debugger.stepOut')
  }

  public getProperties (options) {
    return this.send('Runtime.getProperties', options)
  }

  public evaluateOnFrames (expression: string, frames: Array<any>) {
    return new Promise((resolve, reject) => {
      if (frames.length > 0) {
        let frame = frames.shift()
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
                result.result.className !== 'SyntaxError'
              if (lookOnParent) {
                resolve(this.evaluateOnFrames(expression, frames))
              } else if (result && !result.exceptionDetails) {
                resolve(result)
              } else {
                reject(result)
              }
            })
        } else {
          reject('frame has no id')
        }
      } else {
        reject('there are no frames to evaluate')
      }
    })
  }

  public evaluate (expression: string) {
    let frames = [...(this.callFrames || [])]
    return this.evaluateOnFrames(expression, frames)
  }

  public getScriptById (scriptId: number): Script {
    return this.scripts.find((s) => {
      return parseInt(s.scriptId) === scriptId
    })
  }

  public getScriptByUrl (url: string): Script {
    return this.scripts.find((s) => {
      return s.url === url
    })
  }

  public getCallStack () {
    return this.callFrames.map((frame: any) => {
      frame.location.script = this.getScriptById(parseInt(frame.location.scriptId))
      let sourceMap = frame.location.script.sourceMap
      if (sourceMap) {
        let position = sourceMap.getOriginalPosition(frame.location.lineNumber + 1,
          frame.location.columnNumber)
        frame.location.script.url = position.url
        frame.location.lineNumber = position.lineNumber
        frame.location.columnNumber = position.columnNumber
      }
      return frame
    })
  }

  public getFrameByIndex (index: number) {
    return this.callFrames[index]
  }

  public async setBreakpointFromScript (script: Script, lineNumber: number) {
    let position = {
      url: script.url,
      lineNumber: (lineNumber - 1)
    }
    if (script.sourceMap) {
      position = script.sourceMap.getPosition(lineNumber)
    }
    return await this
      .send('Debugger.setBreakpointByUrl', position)
      .then((response: any) => {
        this.breakpoints.push({
          id: response.breakpointId,
          url: script.url,
          columnNumber: 0,
          lineNumber
        })
      })
  }

  public addBreakpoint (url: string, lineNumber: number) {
    let script = this.getScriptByUrl(url)
    if (script) {
      this.setBreakpointFromScript(script, lineNumber)
    } else {
      let listener = (script) => {
        if (script.url === url) {
          this.setBreakpointFromScript(script, lineNumber)
          this.removeListener('scriptParse', listener)
        }
      }
      this.addListener('scriptParse', listener)
    }
  }

  public getBreakpointById (id): Promise<any> {
    return new Promise ((resolve, reject) => {
      let found = this.breakpoints.find((b: any) => {
        return (b.id === id)
      })
      resolve(found)
    })
  }

  public removeBreakpoint (url: string, lineNumber: number) {
    let breakpoint: any = this.breakpoints.find((b: any) => {
      return (b.url === url && b.lineNumber === lineNumber)
    })
    if (breakpoint) {
      let index = this.breakpoints.indexOf(breakpoint)
      this.breakpoints.splice(index, 1)
      return this.send('Debugger.removeBreakpoint', {
        breakpointId: breakpoint.id
      })
    }
  }
}
