import { RoutingParameter } from './RoutingParameter'

export interface SelectedDimension {
	[key: string]: string[]
}

export type RequestParameterValue = number | string | undefined

export interface RequestParameters<Extra extends RoutingParameter = never> {
	[key: string]: RequestParameterValue | Extra
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

export type RoutingParameterResolver = (name: string) => RequestParameterValue
export type RoutingLinkTarget = string | RequestChange | IncompleteRequestState

type Params = any
type RouteName = string
type ParamsByName<K extends RouteName, T = Params> = T extends { name: K } ? T : never

interface RouteConfigWithoutMapping {
	path: string
	paramsToObject?: undefined
	objectToParams?: undefined
}

interface RouteConfigWithMapping<N, T extends Params = any> {
	path: string
	paramsToObject: (params: T) => { [K in Exclude<keyof N, 'name'>]: N[K] }
	objectToParams: (params: N) => T
}

export type RouteConfig<N> = RouteConfigWithMapping<N> | RouteConfigWithoutMapping
export type RouteMap<N extends RouteName = RouteName> = { [K in N]: RouteConfig<ParamsByName<N>> }
