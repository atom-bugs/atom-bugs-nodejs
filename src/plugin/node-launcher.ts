import { ChromeDebuggingProtocolLauncher } from 'atom-bugs-chrome-debugger/lib/launcher'
import { dirname } from 'path'

export class NodeLauncher extends ChromeDebuggingProtocolLauncher {
  public binaryPath: string
  public launchArguments: Array<string>
  public environmentVariables: Object
  public cwd: string
  public scriptPath: string
  normalizePath (dir) {
    return dir.replace(/^~/, process.env.HOME)
  }
  getLauncherArguments () {
    return [
      `--inspect`,
      `--debug-brk=${this.portNumber}`,
      this.normalizePath(this.scriptPath)
    ].concat(this.launchArguments)
  }
  getProcessOptions () {
    return {
      detached: true,
      shell: true,
      cwd: this.cwd || this.normalizePath(dirname(this.scriptPath)),
      env: this.environmentVariables
    }
  }
  getBinaryPath (): string {
    return this.binaryPath
  }
}


// import { EventEmitter }  from 'events'
// import { spawn, ChildProcess } from 'child_process'
// import { request } from 'http'
// import { type, arch } from 'os'
// import { dirname } from 'path'
//
// export interface Page {
//   type: string,
//   url: string,
//   webSocketDebuggerUrl?: string
// }
//
// export type Pages = Array<Page>
//
// export class NodeLauncher {
//
//   public portNumber: number
//   public hostName: string
//   public binaryPath: string
//
//   private process: ChildProcess
//   private maxAttempts: number = 3
//   private attempt: number = 0
//   private events: EventEmitter = new EventEmitter()
//   // Events
//   didStop (cb) {
//     this.events.on('didStop', cb)
//   }
//   didFail (cb) {
//     this.events.on('didFail', cb)
//   }
//   didReceiveOutput(cb) {
//     this.events.on('didReceiveOutput', cb)
//   }
//   didReceiveError(cb) {
//     this.events.on('didReceiveError', cb)
//   }
//   normalizePath (dir) {
//     return dir.replace(/^~/, process.env.HOME)
//   }
//   // Actions
//   stop () {
//     this.process.kill()
//     this.process = null
//     this.events.emit('didStop')
//   }
//   async start (): Promise<string> {
//     let launchArgs = [
//       `--inspect`,
//       `--debug-brk=${this.portNumber}`,
//       this.normalizePath(this.scriptPath)
//     ].concat(this.launchArguments)
//     let options = {
//       detached: true,
//       shell: true,
//       cwd: this.cwd || this.normalizePath(dirname(this.scriptPath)),
//       env: this.environmentVariables
//     }
//     let output = ''
//     // kill if already running
//     if (this.process) {
//       await this.stop()
//     }
//     // process
//     this.process = spawn(this.binaryPath, launchArgs, options)
//     this.process.stdout.setEncoding('utf8')
//     this.process.stderr.setEncoding('utf8')
//     this.process.stdout.on('data', (res: Uint8Array) => {
//       this.events.emit('didReceiveOutput', res.toString())
//     })
//     this.process.stderr.on('data', (res: Uint8Array) => {
//       output = output.concat(res.toString())
//       this.events.emit('didReceiveError', res)
//     })
//     this.process.stdout.on('end', (res: Uint8Array) => this.events.emit('didReceiveOutput', res))
//     this.process.stderr.on('end', (res: Uint8Array) => this.events.emit('didReceiveError', res))
//     this.process.on('close', (code: number) => {
//       if (code !== 0) {
//         this.events.emit('didFail')
//       }
//       this.events.emit('didStop')
//     })
//     return this.findSocketUrl()
//   }
//   getPages (): Promise<Pages> {
//     return new Promise((resolve, reject) => {
//       let req = request({
//         hostname: this.hostName,
//         port: this.portNumber,
//         path: '/json',
//         method: 'GET'
//       }, (res) => {
//         res.setEncoding('utf8')
//         res.on('data', (chunk) => {
//           try {
//             resolve(JSON.parse(String(chunk)) as Pages)
//           } catch (e) {
//             reject(e)
//           }
//         })
//       })
//       req.on('error', reject)
//       req.end()
//     })
//   }
//   findSocketUrl (): Promise<string> {
//     return new Promise((resolve, reject) => {
//       setTimeout(async () => {
//         let pages = await this
//           .getPages()
//           .catch(() => {
//             if (this.attempt <= this.maxAttempts) {
//               resolve(this.findSocketUrl())
//             } else {
//               reject('unable to get pages')
//             }
//           })
//         let found = (pages || []).find((page: Page) => {
//           return Boolean(page.webSocketDebuggerUrl)
//         })
//         if (found) {
//           resolve(found.webSocketDebuggerUrl)
//         } else {
//           reject('unable to find page with socket')
//         }
//       }, 500)
//     })
//   }
// }
