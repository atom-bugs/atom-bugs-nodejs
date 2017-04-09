import { ChromeDebuggingProtocolLauncher } from 'atom-bugs-chrome-debugger/lib/launcher'
import { dirname, join } from 'path'
import { get, extend } from 'lodash'

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
    let a = [
      `--inspect`,
      `--debug-brk=${this.portNumber}`,
      this.normalizePath(this.scriptPath)
    ]
    .concat(this.launchArguments)
    return a
  }
  getProcessOptions () {
    let projectPath = this.cwd || this.normalizePath(dirname(this.scriptPath))
    let envPath = get(process, 'env.PATH')
    let npmPath = join(projectPath, 'node_modules', '.bin')
    return {
      detached: true,
      shell: true,
      cwd: projectPath,
      env: extend({
        SHELL: get(process, 'env.SHELL'),
        TERM: get(process, 'env.TERM'),
        TMPDIR: get(process, 'env.TMPDIR'),
        USER: get(process, 'env.USER'),
        PATH: `${npmPath}:${envPath}`,
        PWD: get(process, 'env.PWD'),
        LANG: get(process, 'env.LANG'),
        HOME: get(process, 'env.HOME')
      }, this.environmentVariables)
    }
  }
  getBinaryPath (): string {
    return this.binaryPath
  }
}
