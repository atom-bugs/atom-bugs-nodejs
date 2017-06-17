import { ChromeDebuggingProtocolLauncher } from 'xatom-debug-chrome-base/lib/launcher'
import { dirname, join } from 'path'
import { get, extend, pad } from 'lodash'

export class NodeLauncher extends ChromeDebuggingProtocolLauncher {
  public binaryPath: string
  public launchArguments: Array<string>
  public environmentVariables: Object
  public cwd: string
  public scriptPath: string
  getLauncherArguments () {
    let debugArgs = [
      `--inspect-brk=${this.portNumber}`
    ]
    if (get(this, 'scriptPath.length') > 0) {
      debugArgs.push(this.quote(this.scriptPath))
    }
    let launcherArgs = debugArgs.concat(this.launchArguments)
    return launcherArgs
  }
  getProcessOptions () {
    if (!this.cwd) {
      this.cwd = dirname(get(this, 'scriptPath', ''))
    }
    let envPath = get(process, 'env.PATH')
    let npmPath = join(this.cwd, 'node_modules', '.bin')
    return {
      shell: true,
      // windowsVerbatimArguments: true,
      cwd: this.cwd,
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
    return this.quote(this.binaryPath)
  }
}
