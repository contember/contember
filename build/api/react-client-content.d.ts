import { ContentClient } from '@contember/react-client';
import { ContentMutation } from '@contember/client-content';
import { ContentQuery } from '@contember/client-content';
import { QueryExecutorOptions } from '@contember/client-content';

export declare type ContentMutationOptions<T> = QueryExecutorOptions;

export declare type ContentMutationResult<Result, Variables extends Record<string, any>> = readonly [
state: ContentMutationState<Result>,
mutate: (variables: Variables) => Promise<Result>
];

export declare type ContentMutationState<Result> = {
    state: 'initial';
} | {
    state: 'loading';
} | {
    state: 'error';
    error: unknown;
} | {
    state: 'success';
    data: Result;
};

export declare type ContentQueryOptions = QueryExecutorOptions;

export declare type ContentQueryResult<T> = readonly [
state: ContentQueryState<T>,
meta: () => void
];

export declare type ContentQueryState<Result> = {
    state: 'loading';
} | {
    state: 'error';
    error: unknown;
} | {
    state: 'success';
    data: Result;
} | {
    state: 'refreshing';
    data: Result;
};

export declare const useContentClient: () => ContentClient;

export declare function useContentMutation<Value, Variables extends Record<string, any>>(mutationFn: (variables: Variables) => ContentMutation<Value>, options?: ContentMutationOptions<Value>): ContentMutationResult<Value, Variables>;

export declare function useContentMutation<Value, Variables extends Record<string, any>>(mutationFn: (variables: Variables) => ContentMutation<Value>[], options?: ContentMutationOptions<Value[]>): ContentMutationResult<Value[], Variables>;

export declare function useContentMutation<Values extends Record<string, any>, Variables extends Record<string, any>>(mutationFn: (variables: Variables) => {
    [K in keyof Values]: ContentMutation<Values[K]> | ContentQuery<Values[K]>;
}, options?: ContentMutationOptions<Values>): ContentMutationResult<Values, Variables>;

export declare function useContentQuery<Value>(query: ContentQuery<Value>, options?: ContentQueryOptions): ContentQueryResult<Value>;

export declare function useContentQuery<Values extends Record<string, any>>(queries: {
    [K in keyof Values]: ContentQuery<Values[K]>;
}, options?: ContentQueryOptions): ContentQueryResult<Values>;

export { }
