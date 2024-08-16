import { SelectedDimension } from './dimensions'

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

export interface RoutingContextValue {
	basePath: string
	routes: RouteMap
	defaultDimensions?: SelectedDimension
	pageInQuery?: boolean
}
