import { ChromeDebuggingProtocolDebugger } from 'atom-bugs-chrome-debugger/lib/debugger'

export class NodeDebugger extends ChromeDebuggingProtocolDebugger {
  constructor () {
    super()
  }
  getFeatures (): Array<Promise<any>> {
    var {
      Profiler,
      Runtime,
      Debugger,
      Page
    } = this.domains

    return [
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
    ]
  }
}
