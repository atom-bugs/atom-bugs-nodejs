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
