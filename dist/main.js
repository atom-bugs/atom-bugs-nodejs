'use babel';
import { NodeBugsPlugin } from './node';
const { CompositeDisposable, Disposable } = require('atom');
export default {
    bugs: null,
    plugin: new NodeBugsPlugin(),
    consumeBugsService(bugs) {
        this.bugs = bugs;
        this.bugs.addPlugin(this.plugin);
    },
    activate() {
        require('atom-package-deps').install('atom-bugs-nodejs', true);
    },
    deactivate() {
        if (this.bugs) {
            this.bugs.removePlugin(this.plugin);
        }
    }
};
//# sourceMappingURL=main.js.map