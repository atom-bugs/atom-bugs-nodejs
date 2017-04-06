import { ChromeDebuggingProtocolDebugger } from 'atom-bugs-chrome-debugger/lib/debugger'

export class NodeDebugger extends ChromeDebuggingProtocolDebugger {
  public skipFirstPause: boolean = true
  constructor () {
    super()
  }
  async didConnect (domains): Promise<any> {
    var { Profiler, Runtime, Debugger, Page } = domains
    Debugger.paused((params) => {
      if (this.skipFirstPause) {
        Debugger.resume()
        this.skipFirstPause = false
      }
    })
    return await Promise.all([
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
    ])
  }
}
