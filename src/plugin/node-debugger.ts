import { ChromeDebuggingProtocolDebugger } from 'xatom-debug-chrome-base/lib/debugger'

export class NodeDebugger extends ChromeDebuggingProtocolDebugger {
  constructor () {
    super()
  }
  async didConnect (domains): Promise<any> {
    var { Profiler, Runtime, Debugger, Page } = domains
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
