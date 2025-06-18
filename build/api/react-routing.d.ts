import { BaseSyntheticEvent } from 'react';
import { ComponentType } from 'react';
import { Context } from 'react';
import { EntityAccessor } from '@contember/react-binding';
import { FunctionComponent } from 'react';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { NamedExoticComponent } from 'react';
import { ReactElement } from 'react';
import { ReactNode } from 'react';
import { StateStorageOrName } from '@contember/react-utils';

/**
 * @internal
 */
export declare const AddRequestListenerContext: Context<(handler: RequestChangeHandler) => () => void>;

/**
 * @internal
 */
export declare const CurrentRequestContext: Context<RequestState>;

export declare const DimensionLink: NamedExoticComponent<DimensionLinkProps>;

export declare type DimensionLinkAction = 'add' | 'toggle' | 'set' | 'unset';

export declare interface DimensionLinkProps {
    dimension: string;
    value: string;
    children: ReactElement;
    action?: DimensionLinkAction;
}

export declare type DynamicRequestParameters = RequestParameters<RoutingParameter>;

export declare type IncompleteRequestState = Partial<RequestState<DynamicRequestParameters>> & {
    pageName: string;
} | null;

export declare type LazyPageModule = () => Promise<PageModule>;

/**
 * @group Routing
 */
export declare const Link: NamedExoticComponent<LinkProps>;

export declare type LinkProps = Omit<RoutingLinkProps, 'parametersResolver'>;

/**
 * Page specifies one page. It must have a `name` prop and it's child must be a function which takes page's params and returns React node to render.
 */
export declare const Page: {
    <P>(props: PageProps<P>): JSX_2.Element | null;
    displayName: string;
    getPageName(props: PageProps<unknown>): string;
};

export declare interface PageModule {
    [action: string]: ComponentType<any> | ReactElement<any> | undefined;
}

export declare class PageNotFound extends Error {
    constructor(reason?: string);
}

export declare interface PageProps<P> {
    name: string;
    children: FunctionComponent<P> | ReactNode;
}

export declare interface PageProvider<P> {
    getPageName(props: P, fallback?: string): string;
}

export declare type PageProviderElement = ReactElement<any, ComponentType<any> & PageProvider<any>>;

export declare interface PageRequest<P extends RequestParameters<RoutingParameter> = RequestParameters> {
    pageName: string;
    parameters: P;
    dimensions: SelectedDimension;
}

/**
 * Pages element specifies collection of pages (component Page or component with getPageName static method).
 */
export declare const Pages: ({ children, layout, ErrorBoundary, suspenseFallback }: PagesProps) => JSX_2.Element | null;

export declare type PagesMap = Record<string, PagesMapElement>;

export declare type PagesMapElement = LazyPageModule | PageModule | ComponentType<any> | ReactElement<any> | PageProviderElement;

export declare interface PagesProps {
    children: PagesMap | PageProviderElement[] | PageProviderElement;
    layout?: ComponentType<{
        children?: ReactNode;
    }>;
    ErrorBoundary?: ComponentType<{
        children: ReactNode;
    }>;
    NotFound?: ComponentType<{}>;
    suspenseFallback?: ReactNode;
}

/**
 * @internal
 */
export declare const PushRequestContext: Context<(req: RequestState) => void>;

export declare type RequestChange = (currentState: RequestState) => IncompleteRequestState | string;

export declare interface RequestChangeEvent {
    readonly request: RequestState;
    readonly abortNavigation: () => void;
}

export declare type RequestChangeHandler = (event: RequestChangeEvent) => void;

export declare type RequestParameters<Extra extends RoutingParameter = never> = {
    [K in string]?: RequestParameterValue | Extra;
};

export declare type RequestParameterValue = number | string;

export declare type RequestState<Parameters extends RequestParameters<RoutingParameter> = RequestParameters> = PageRequest<Parameters> | null;

export declare type RouteConfig<N> = RouteConfigWithMapping<N> | RouteConfigWithoutMapping;

export declare interface RouteConfigWithMapping<N, T extends RouteParams = any> {
    path: string;
    paramsToObject: (params: T) => {
        [K in Exclude<keyof N, 'name'>]: N[K];
    };
    objectToParams: (params: N) => T;
}

export declare interface RouteConfigWithoutMapping {
    path: string;
    paramsToObject?: undefined;
    objectToParams?: undefined;
}

export declare type RouteMap<N extends RouteName = RouteName> = {
    [K in N]: RouteConfig<RouteParamsByName<N>>;
};

export declare type RouteName = string;

export declare type RouteParams = any;

export declare type RouteParamsByName<K extends RouteName, T = RouteParams> = T extends {
    name: K;
} ? T : never;

/**
 * @internal
 */
export declare const RoutingContext: Context<RoutingContextValue>;

export declare interface RoutingContextValue {
    basePath: string;
    routes: RouteMap;
    defaultDimensions?: SelectedDimension;
    pageInQuery?: boolean;
}

/**
 * Low level link. Usually, you should use {@link Link}
 *
 * @group Routing
 */
export declare const RoutingLink: NamedExoticComponent<RoutingLinkProps>;

export declare interface RoutingLinkParams {
    href: string;
    navigate: (e?: BaseSyntheticEvent) => void;
    isActive: boolean;
}

export declare interface RoutingLinkProps {
    children?: ReactElement;
    to: RoutingLinkTarget;
    parametersResolver?: RoutingParameterResolver;
    parameters?: RequestParameters;
}

export declare type RoutingLinkTarget = string | RequestChange | IncompleteRequestState;

export declare class RoutingParameter {
    readonly name: string;
    constructor(name: string);
}

export declare type RoutingParameterResolver = (name: string) => RequestParameterValue | undefined;

export declare const RoutingProvider: ({ children, ...props }: RoutingProviderProps) => JSX_2.Element;

export declare type RoutingProviderProps = Partial<RoutingContextValue> & {
    children: ReactNode;
};

export declare interface SelectedDimension {
    [key: string]: string[];
}

export declare const useAddRequestChangeListener: () => (handler: RequestChangeHandler) => () => void;

export declare const useCurrentRequest: () => RequestState;

export declare const useDimensionState: ({ dimension, defaultValue, storage }: {
    dimension: string;
    defaultValue: string | string[];
    storage?: StateStorageOrName;
}) => string[];

export declare const useLinkFactory: () => (target: RoutingLinkTarget, parameters?: RequestParameters, entity?: EntityAccessor) => RoutingLinkParams;

export declare const usePushRequest: () => (req: RequestState) => void;

export declare const useRedirect: () => (target: RoutingLinkTarget, parameters?: RequestParameters) => void;

export declare const useRegisterRequestChangeListener: (listener: RequestChangeHandler) => void;

export declare const useRouting: () => RoutingContextValue;

export declare const useRoutingLink: (target: RoutingLinkTarget, parametersResolver?: RoutingParameterResolver, parameters?: RequestParameters) => RoutingLinkParams;

export declare const useRoutingLinkFactory: () => (target: RoutingLinkTarget, parameters?: RequestParameters, parametersResolver?: RoutingParameterResolver) => RoutingLinkParams;

export { }
