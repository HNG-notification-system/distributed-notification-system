export declare class AppController {
    getInfo(): {
        service: string;
        version: string;
        description: string;
        endpoints: {
            health: string;
            docs: string;
            templates: string;
        };
    };
}
