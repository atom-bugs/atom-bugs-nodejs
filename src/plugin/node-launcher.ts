// import { ChromeDebuggingProtocolLauncher } from 'xatom-debug-chrome-base/lib/launcher'
// import { dirname, join } from 'path'
// import { get, extend, pad } from 'lodash'
// import { exec } from 'child_process'
//
// export class NodeLauncher extends ChromeDebuggingProtocolLauncher {
//   public binaryPath: string
//   public launchArguments: Array<string>
//   public environmentVariables: Object
//   public cwd: string
//   public scriptPath: string
//   getInpectArguments (): Promise<Array<string>> {
//     return new Promise((reject, resolve) => {
//       let inspectArgs = []
//       exec(`${this.getBinaryPath()} -v`, (err, stdout, stderr) => {
//         let version = stdout.match(/^v(\d+)\.(\d+).(\d+)/);
//         if (version) {
//           let [completeVersion, major, minor, path] = version;
//           if (parseInt(major) >= 8) {
//             inspectArgs.push(`--inspect=${this.portNumber} --debug-brk`);
//           } else if (parseInt(major) > 6 || (parseInt(major) === 6 && parseInt(minor) >= 3)) {
//             inspectArgs.push(`--inspect`, `--debug-brk=${this.portNumber}`);
//           } else {
//             throw new Error(`XAtom Debug NodeJS does not support version ${completeVersion}. Please use 6.3+`);
//           }
//           resolve(inspectArgs)
//         }
//         reject(err);
//       })
//     })
//   }
//   async getLauncherArguments () {
//     let debugArgs = [... await this.getInpectArguments()];
//     if (get(this, 'scriptPath.length') > 0) {
//       debugArgs.push(this.quote(this.scriptPath))
//     }
//     let launcherArgs = debugArgs.concat(this.launchArguments)
//     return launcherArgs
//   }
//   getProcessOptions () {
//     if (!this.cwd) {
//       this.cwd = dirname(get(this, 'scriptPath', ''))
//     }
//     let envPath = get(process, 'env.PATH')
//     let npmPath = join(this.cwd, 'node_modules', '.bin')
//     return {
//       shell: true,
//       // windowsVerbatimArguments: true,
//       cwd: this.cwd,
//       env: extend({
//         SHELL: get(process, 'env.SHELL'),
//         TERM: get(process, 'env.TERM'),
//         TMPDIR: get(process, 'env.TMPDIR'),
//         USER: get(process, 'env.USER'),
//         PATH: `${npmPath}:${envPath}`,
//         PWD: get(process, 'env.PWD'),
//         LANG: get(process, 'env.LANG'),
//         HOME: get(process, 'env.HOME')
//       }, this.environmentVariables)
//     }
//   }
//   getBinaryPath (): string {
//     return this.quote(this.binaryPath)
//   }
// }
