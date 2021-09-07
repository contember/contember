export interface SelectedDimension {
	[key: string]: string[]
}

export interface PageParameters {
	[key: string]: string | PageParameters | undefined
}

export interface PageRequest<P extends PageParameters> {
	pageName: string
	parameters: P
	dimensions: SelectedDimension
}

export type RequestState = PageRequest<any> | null

export type RequestChange = (currentState: RequestState) => RequestState

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
