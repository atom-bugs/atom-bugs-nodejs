export declare class NodePlugin {
    private debugger;
    private client;
    name: String;
    iconPath: String;
    options: Object;
    constructor();
    registerClient(atomBugsClient: any): void;
    didRun(setup: any): void;
    didStop(): void;
    didResume(): void;
    didPause(): void;
    didAddBreakpoint(filePath: any, fileNumber: any): void;
    didRemoveBreakpoint(filePath: any, fileNumber: any): void;
    didStepOver(): void;
    didStepInto(): void;
    didStepOut(): void;
    didEvaluateExpression(expression: string, range: any): Promise<void>;
}
