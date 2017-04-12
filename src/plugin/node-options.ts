export const Runtype = {
  CurrentFile: 'Current File',
  Script: 'Project',
  Remote: 'Remote'
}

export const NodeOptions = {
  runType: {
    type: 'string',
    title: 'Run Type',
    default: Runtype.CurrentFile,
    enum: Object.keys(Runtype).map((k) => Runtype[k])
  },
  binaryPath: {
    type: 'string',
    title: 'Binary Path',
    default: '/usr/local/bin/node',
    visible: {
      runType: {
        contains: [ Runtype.Script, Runtype.CurrentFile ]
      }
    }
  },
  port: {
    type: 'number',
    title: 'Port Number',
    default: 5858,
    visible: {
      runType: {
        contains: [ Runtype.Script, Runtype.CurrentFile ]
      }
    }
  },
  scriptPath: {
    type: 'string',
    title: 'Source Script',
    description: 'Enter the file path relative to the current project workspace.',
    visible: {
      runType: {
        contains: [ Runtype.Script ]
      }
    }
  },
  remoteUrl: {
    type: 'string',
    title: 'Remote Url',
    default: 'localhost',
    visible: {
      runType: {
        contains: [ Runtype.Remote ]
      }
    }
  },
  remotePort: {
    type: 'number',
    title: 'Remote Port',
    default: 5858,
    visible: {
      runType: {
        contains: [ Runtype.Remote ]
      }
    }
  },
  restartOnChanges: {
    type: 'boolean',
    title: 'Restart On Changes',
    default: false,
    visible: {
      runType: {
        contains: [ Runtype.Script, Runtype.CurrentFile ]
      }
    }
  },
  changesPattern: {
    type: 'string',
    title: 'Changes Pattern',
    default: '**/*.js',
    visible: {
      runType: { is: Runtype.Script },
      restartOnChanges: { is: true }
    }
  },
  launchArguments: {
    type: 'array',
    title: 'Launch Arguments',
    default: [],
    visible: {
      runType: {
        contains: [ Runtype.Script, Runtype.CurrentFile ]
      }
    }
  },
  environmentVariables: {
    type: 'object',
    title: 'Environment Variables',
    default: {},
    visible: {
      runType: {
        contains: [ Runtype.Script, Runtype.CurrentFile ]
      }
    }
  }
}
