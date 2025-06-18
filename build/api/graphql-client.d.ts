export declare class GraphQlClient {
    private readonly options;
    constructor(options: GraphQlClientOptions);
    get apiUrl(): string;
    withOptions(options: Partial<GraphQlClientOptions>): GraphQlClient;
    execute<T = unknown>(query: string, options?: GraphQlClientRequestOptions): Promise<T>;
    protected doExecute(query: string, { apiToken, signal, variables, headers }?: GraphQlClientRequestOptions): Promise<Response>;
}

export declare interface GraphQlClientBaseOptions {
    readonly apiToken?: string;
    readonly headers?: Record<string, string>;
    readonly onBeforeRequest?: (query: {
        query: string;
        variables: GraphQlClientVariables;
    }) => void;
    readonly onResponse?: (response: Response) => void;
    readonly onData?: (json: unknown) => void;
}

export declare class GraphQlClientError extends Error {
    readonly type: GraphQlErrorType;
    readonly request: GraphQlErrorRequest;
    readonly response?: Response | undefined;
    readonly errors?: readonly any[] | undefined;
    constructor(message: string, type: GraphQlErrorType, request: GraphQlErrorRequest, response?: Response | undefined, errors?: readonly any[] | undefined, cause?: unknown);
}

export declare interface GraphQlClientOptions extends GraphQlClientBaseOptions {
    readonly url: string;
    readonly fetcher?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
}

export declare interface GraphQlClientRequestOptions extends GraphQlClientBaseOptions {
    readonly variables?: GraphQlClientVariables;
    readonly signal?: AbortSignal;
}

export declare interface GraphQlClientVariables {
    [name: string]: any;
}

export declare type GraphQlErrorRequest = {
    url: string;
    query: string;
    variables: Record<string, any>;
};

export declare type GraphQlErrorType = 'aborted' | 'network error' | 'invalid response body' | 'bad request' | 'unauthorized' | 'forbidden' | 'server error' | 'response errors';

export { }
