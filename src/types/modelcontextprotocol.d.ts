declare module '@modelcontextprotocol/sdk' {
  interface ToolDefinition {
    description: string;
    parameters: Record<string, {
      type: string;
      description: string;
    }>;
    handler: (params: any) => Promise<any>;
  }

  class Server {
    constructor(name: string);
    addTool(name: string, definition: ToolDefinition): void;
    start(): void;
  }

  export { Server };
}