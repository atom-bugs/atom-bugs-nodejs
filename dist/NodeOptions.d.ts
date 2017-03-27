export declare const Runtype: {
    CurrentFile: string;
    Script: string;
    Remote: string;
};
export declare const NodeOptions: {
    runType: {
        type: string;
        title: string;
        default: string;
        enum: any[];
    };
    binaryPath: {
        type: string;
        title: string;
        default: string;
        visible: {
            runType: {
                contains: string[];
            };
        };
    };
    port: {
        type: string;
        title: string;
        default: number;
        visible: {
            runType: {
                contains: string[];
            };
        };
    };
    scriptPath: {
        type: string;
        title: string;
        default: string;
        visible: {
            runType: {
                contains: string[];
            };
        };
    };
    remoteUrl: {
        type: string;
        title: string;
        default: string;
        visible: {
            runType: {
                contains: string[];
            };
        };
    };
    remotePort: {
        type: string;
        title: string;
        default: number;
        visible: {
            runType: {
                contains: string[];
            };
        };
    };
    environmentVariables: {
        type: string;
        title: string;
        default: {};
        visible: {
            runType: {
                contains: string[];
            };
        };
    };
    launchArguments: {
        type: string;
        title: string;
        default: any[];
        visible: {
            runType: {
                contains: string[];
            };
        };
    };
};
