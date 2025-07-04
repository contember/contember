import { ContemberClientProps } from '@contember/react-client';
import { createErrorHandler } from '@contember/react-devbar';
import { EntityAccessor } from '@contember/react-binding';
import { Environment } from '@contember/react-binding';
import { ErrorPersistResult } from '@contember/react-binding';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { NamedExoticComponent } from 'react';
import { ReactNode } from 'react';
import { RequestParameters } from '@contember/react-routing';
import { RouteMap } from '@contember/react-routing';
import { RoutingLinkTarget } from '@contember/react-routing';
import { SuccessfulPersistResult } from '@contember/react-binding';
import { SugaredRelativeSingleEntity } from '@contember/react-binding';
import { SugaredRelativeSingleField } from '@contember/react-binding';

/**
 * @group Entrypoints
 */
export declare const ApplicationEntrypoint: (props: ApplicationEntrypointProps) => JSX_2.Element;

export declare interface ApplicationEntrypointProps extends ContemberClientProps {
    basePath: string;
    sessionToken?: string;
    routes?: RouteMap;
    children: ReactNode;
    environment?: Environment;
}

export declare type BlockNavigationOnDirtyStateResult = 'save' | 'discard' | 'cancel';

export declare const ClearFieldTrigger: NamedExoticComponent<ClearFieldTriggerProps>;

export declare interface ClearFieldTriggerProps {
    field: SugaredRelativeSingleField['field'];
    children: ReactNode;
}

export { createErrorHandler }

export declare const DisconnectEntityTrigger: ({ immediatePersist, onPersistError, onPersistSuccess, field, ...props }: DisconnectEntityTriggerProps) => JSX_2.Element;

export declare interface DisconnectEntityTriggerProps {
    immediatePersist?: true;
    children: ReactNode;
    onPersistSuccess?: (result: SuccessfulPersistResult) => void;
    onPersistError?: (result: ErrorPersistResult) => void;
    field?: SugaredRelativeSingleEntity['field'];
}

export declare const EntityBeforePersist: ({ listener }: {
    listener: EntityAccessor.EntityEventListenerMap["beforePersist"];
}) => null;

export declare const RedirectOnPersist: ({ to, parameters }: {
    to: RoutingLinkTarget;
    parameters?: RequestParameters;
}) => null;

export declare const useBlockNavigationOnDirtyState: (handler: () => Promise<BlockNavigationOnDirtyStateResult>, options?: {
    onPersistSuccess?: (result: SuccessfulPersistResult) => void;
    onPersistError?: (result: ErrorPersistResult) => void;
}) => void;

export declare const useIsApplicationOutdated: ({ checkIntervalMs }?: {
    checkIntervalMs?: number;
}) => boolean;


export * from "@contember/react-binding";
export * from "@contember/react-identity";
export * from "@contember/react-routing";

export { }
