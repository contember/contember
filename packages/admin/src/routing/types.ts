import { RoutingParameter } from './RoutingParameter'

export interface SelectedDimension {
	[key: string]: string[]
}

export type RequestParameterValue = number | string

export type RequestParameters<Extra extends RoutingParameter = never> = {
	[K in string]?: RequestParameterValue | Extra
}

export interface PageRequest<P extends RequestParameters<RoutingParameter> = RequestParameters> {
	pageName: string
	parameters: P
	dimensions: SelectedDimension
}

export type RequestState<Parameters extends RequestParameters<RoutingParameter> = RequestParameters> = PageRequest<Parameters> | null

export type RequestChange = (currentState: RequestState) => IncompleteRequestState
export type DynamicRequestParameters = RequestParameters<RoutingParameter>;
export type IncompleteRequestState = Partial<RequestState<DynamicRequestParameters>> & { pageName: string } | null

export type RoutingParameterResolver = (name: string) => RequestParameterValue | undefined
export type RoutingLinkTarget = string | RequestChange | IncompleteRequestState

export type RouteParams = any
export type RouteName = string
export type RouteParamsByName<K extends RouteName, T = RouteParams> = T extends { name: K } ? T : never

export interface RouteConfigWithoutMapping {
	path: string
	paramsToObject?: undefined
	objectToParams?: undefined
}

export interface RouteConfigWithMapping<N, T extends RouteParams = any> {
	path: string
	paramsToObject: (params: T) => { [K in Exclude<keyof N, 'name'>]: N[K] }
	objectToParams: (params: N) => T
}

export type RouteConfig<N> = RouteConfigWithMapping<N> | RouteConfigWithoutMapping
export type RouteMap<N extends RouteName = RouteName> = { [K in N]: RouteConfig<RouteParamsByName<N>> }
