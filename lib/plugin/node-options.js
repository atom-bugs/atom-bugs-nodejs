"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Runtype = {
    CurrentFile: 'Current File',
    Script: 'Project',
    Remote: 'Remote'
};
exports.NodeOptions = {
    runType: {
        type: 'string',
        title: 'Run Type',
        default: exports.Runtype.CurrentFile,
        enum: Object.keys(exports.Runtype).map(function (k) { return exports.Runtype[k]; })
    },
    binaryPath: {
        type: 'string',
        title: 'Binary Path',
        default: '/usr/local/bin/node',
        visible: {
            runType: {
                contains: [exports.Runtype.Script, exports.Runtype.CurrentFile]
            }
        }
    },
    port: {
        type: 'number',
        title: 'Port Number',
        default: 5858,
        visible: {
            runType: {
                contains: [exports.Runtype.Script, exports.Runtype.CurrentFile]
            }
        }
    },
    scriptPath: {
        type: 'string',
        title: 'Source Script',
        description: 'Enter the file path relative to the current project workspace.',
        visible: {
            runType: {
                contains: [exports.Runtype.Script]
            }
        }
    },
    remoteUrl: {
        type: 'string',
        title: 'Remote Url',
        default: 'localhost',
        visible: {
            runType: {
                contains: [exports.Runtype.Remote]
            }
        }
    },
    remotePort: {
        type: 'number',
        title: 'Remote Port',
        default: 5858,
        visible: {
            runType: {
                contains: [exports.Runtype.Remote]
            }
        }
    },
    restartOnChanges: {
        type: 'boolean',
        title: 'Restart On Changes',
        default: false,
        visible: {
            runType: {
                contains: [exports.Runtype.Script, exports.Runtype.CurrentFile]
            }
        }
    },
    changesPattern: {
        type: 'string',
        title: 'Changes Pattern',
        default: '**/*.js',
        visible: {
            runType: { is: exports.Runtype.Script },
            restartOnChanges: { is: true }
        }
    },
    launchArguments: {
        type: 'array',
        title: 'Launch Arguments',
        default: [],
        visible: {
            runType: {
                contains: [exports.Runtype.Script, exports.Runtype.CurrentFile]
            }
        }
    },
    environmentVariables: {
        type: 'object',
        title: 'Environment Variables',
        default: {},
        visible: {
            runType: {
                contains: [exports.Runtype.Script, exports.Runtype.CurrentFile]
            }
        }
    }
};
//# sourceMappingURL=node-options.js.map