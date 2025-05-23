## API Report File for "@contember/interface"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

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

// @public (undocumented)
export const ApplicationEntrypoint: (props: ApplicationEntrypointProps) => JSX_2.Element;

// @public (undocumented)
export interface ApplicationEntrypointProps extends ContemberClientProps {
    // (undocumented)
    basePath: string;
    // (undocumented)
    children: ReactNode;
    // (undocumented)
    environment?: Environment;
    // (undocumented)
    routes?: RouteMap;
    // (undocumented)
    sessionToken?: string;
}

// @public (undocumented)
export type BlockNavigationOnDirtyStateResult = 'save' | 'discard' | 'cancel';

// @public (undocumented)
export const ClearFieldTrigger: NamedExoticComponent<ClearFieldTriggerProps>;

// @public (undocumented)
export interface ClearFieldTriggerProps {
    // (undocumented)
    children: ReactNode;
    // (undocumented)
    field: SugaredRelativeSingleField['field'];
}

export { createErrorHandler }

// @public (undocumented)
export const DisconnectEntityTrigger: ({ immediatePersist, onPersistError, onPersistSuccess, field, ...props }: DisconnectEntityTriggerProps) => JSX_2.Element;

// @public (undocumented)
export interface DisconnectEntityTriggerProps {
    // (undocumented)
    children: ReactNode;
    // (undocumented)
    field?: SugaredRelativeSingleEntity['field'];
    // (undocumented)
    immediatePersist?: true;
    // (undocumented)
    onPersistError?: (result: ErrorPersistResult) => void;
    // (undocumented)
    onPersistSuccess?: (result: SuccessfulPersistResult) => void;
}

// @public (undocumented)
export const EntityBeforePersist: ({ listener }: {
    listener: EntityAccessor.EntityEventListenerMap["beforePersist"];
}) => null;

// @public (undocumented)
export const RedirectOnPersist: ({ to, parameters }: {
    to: RoutingLinkTarget;
    parameters?: RequestParameters;
}) => null;

// @public (undocumented)
export const useBlockNavigationOnDirtyState: (handler: () => Promise<BlockNavigationOnDirtyStateResult>, options?: {
    onPersistSuccess?: (result: SuccessfulPersistResult) => void;
    onPersistError?: (result: ErrorPersistResult) => void;
}) => void;

// @public (undocumented)
export const useIsApplicationOutdated: ({ checkIntervalMs }?: {
    checkIntervalMs?: number;
}) => boolean;


export * from "@contember/react-binding";
export * from "@contember/react-identity";
export * from "@contember/react-routing";

// (No @packageDocumentation comment for this package)

```
