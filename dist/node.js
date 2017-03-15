'use babel';
export class NodeBugsPlugin {
    constructor() {
        this.name = 'Node.js';
        this.iconPath = 'atom://atom-bugs-nodejs/icons/nodejs.svg';
    }
    execute() {
        console.log('execute');
    }
    setBreakpoint() {
        console.log('set breakpoint');
    }
    evalExpression() {
    }
}
//# sourceMappingURL=node.js.map