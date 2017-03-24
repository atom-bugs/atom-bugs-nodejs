export declare class NodePlugin {
    private debugger;
    private client;
    name: String;
    iconPath: String;
    options: Object;
    constructor();
    register(client: any): void;
    didRun(setup: any): void;
    didStop(): void;
    didResume(): void;
    didPause(): Promise<void>;
    didAddBreakpoint(filePath: any, fileNumber: any): void;
    didRemoveBreakpoint(filePath: any, fileNumber: any): void;
    didStepOver(): void;
    didStepInto(): void;
    didStepOut(): void;
    didRequestProperties(request: any, propertyView: any): Promise<void>;
    didEvaluateExpression(expression: string, evaluationView: any): Promise<void>;
}
