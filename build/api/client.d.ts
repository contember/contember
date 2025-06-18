import { GraphQlPrintResult } from '@contember/graphql-builder';
import { Input } from '@contember/schema';
import { Result } from '@contember/schema';
import { Value } from '@contember/schema';
import { Writable } from '@contember/schema';

export declare class GenerateUploadUrlMutationBuilder {
    private static generateUploadUrlFields;
    /**
     * @internal
     */
    static buildQuery(parameters: GenerateUploadUrlMutationBuilder.MutationParameters): GraphQlPrintResult;
}

export declare namespace GenerateUploadUrlMutationBuilder {
    export type Acl = 'PUBLIC_READ' | 'PRIVATE' | 'NONE';
    export type FileParameters = {
        contentType: string;
        expiration?: number;
        size?: number;
        prefix?: string;
        extension?: string;
        suffix?: string;
        fileName?: string;
        acl?: Acl;
    };
    export interface MutationParameters {
        [alias: string]: FileParameters;
    }
    export interface ResponseBody {
        url: string;
        publicUrl: string;
        method: string;
        headers: Array<{
            key: string;
            value: string;
        }>;
    }
    export interface MutationResponse {
        [alias: string]: ResponseBody;
    }
}

export { Input }

export { Result }

export { Value }

export { Writable }


export * from "@contember/client-content";
export * from "@contember/graphql-client";

export { }
