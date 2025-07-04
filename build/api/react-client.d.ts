import { Context } from 'react';
import { GraphQlClient } from '@contember/client';
import { GraphQlClient as GraphQlClient_2 } from '@contember/graphql-client';
import type { GraphQlClientError } from '@contember/client';
import type { GraphQlClientRequestOptions } from '@contember/client';
import type { GraphQlClientVariables } from '@contember/client';
import { NamedExoticComponent } from 'react';

export declare const ApiBaseUrlContext: Context<string | undefined>;

export declare type ApiRequestAction<SuccessData> = {
    type: 'uninitialize';
} | {
    type: 'initialize';
} | {
    type: 'resolveSuccessfully';
    data: SuccessData;
} | {
    type: 'resolveWithError';
    error: GraphQlClientError;
};

export declare type ApiRequestReducer<SuccessData> = (previousState: ApiRequestState<SuccessData>, action: ApiRequestAction<SuccessData>) => ApiRequestState<SuccessData>;

export declare const apiRequestReducer: <SuccessData>(previousState: ApiRequestState<SuccessData>, action: ApiRequestAction<SuccessData>) => ApiRequestState<SuccessData>;

export declare type ApiRequestState<SuccessData> = {
    isLoading: false;
    isFinished: false;
    readyState: 'uninitialized';
} | {
    isLoading: true;
    isFinished: false;
    readyState: 'pending';
} | {
    isLoading: false;
    isFinished: true;
    readyState: 'networkSuccess';
    data: SuccessData;
} | {
    isLoading: false;
    isFinished: true;
    readyState: 'networkError';
    data: GraphQlClientError;
};

export declare class ClientError extends Error {
}

/**
 * @group Entrypoints
 */
export declare const ContemberClient: NamedExoticComponent<ContemberClientProps & {
children: React.ReactNode;
}>;

export declare interface ContemberClientProps {
    apiBaseUrl: string;
    sessionToken?: string;
    loginToken?: string;
    project?: string;
    stage?: string;
}

export declare const LoginTokenContext: Context<string | undefined>;

export declare const ProjectSlugContext: Context<string | undefined>;

export declare const SessionTokenContext: Context<SessionTokenContextValue>;

export declare interface SessionTokenContextValue {
    propsToken: string | undefined;
    source: 'props' | 'localstorage' | undefined;
    token: string | undefined;
}

export declare const SetSessionTokenContext: Context<(token: string | undefined) => void>;

export declare const StageSlugContext: Context<string | undefined>;

export declare const useApiBaseUrl: () => string | undefined;

export declare const useApiRequest: <SuccessData>(client: GraphQlClient) => UseApiRequestResult<SuccessData>;

export declare type UseApiRequestResult<SuccessData> = [
ApiRequestState<SuccessData>,
(query: string, variables?: GraphQlClientVariables, options?: Omit<GraphQlClientRequestOptions, 'variables'>) => Promise<SuccessData>
];

export declare const useContentApiRequest: <SuccessData>() => UseApiRequestResult<SuccessData>;

export declare const useContentGraphQlClient: (projectSlug: string, stageSlug: string) => GraphQlClient;

export declare const useCurrentContentGraphQlClient: () => GraphQlClient;

export declare const useCurrentSystemGraphQlClient: () => GraphQlClient;

export declare const useGraphQlClient: (path: string) => GraphQlClient;

export declare const useLoginToken: () => string | undefined;

export declare const useProjectSlug: () => string | undefined;

export declare const useSessionToken: () => string | undefined;

export declare const useSessionTokenWithMeta: () => SessionTokenContextValue;

export declare const useSetSessionToken: () => (token: string | undefined) => void;

export declare const useStageSlug: () => string | undefined;

export declare const useSystemApiRequest: <SuccessData>() => UseApiRequestResult<SuccessData>;

export declare const useSystemGraphQlClient: (projectSlug: string) => GraphQlClient_2;

export declare const useTenantApiRequest: <SuccessData>() => UseApiRequestResult<SuccessData>;

export declare const useTenantGraphQlClient: () => GraphQlClient_2;


export * from "@contember/client";
export * from "@contember/react-richtext-renderer";

export { }
