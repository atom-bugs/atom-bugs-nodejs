'use babel';

export class NodeBugsPlugin {
  public name: String = 'Node.js';
  public iconPath: String = 'atom://atom-bugs-nodejs/icons/nodejs.svg';
  constructor () {

  }
  execute () {
    console.log('execute');
  }
  setBreakpoint () {
    console.log('set breakpoint')
  }
  evalExpression () {

  }
}
