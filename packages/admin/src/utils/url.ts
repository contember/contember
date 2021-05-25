import pathToRegexp from 'path-to-regexp'
import type RequestState from '../state/request'

type RouteName = RequestState['name']
type RequestByName<K extends RouteName, T = RequestState> = T extends { name: K } ? T : never
interface RouteConfigWithoutMapping {
	path: string
	encodeParams?: undefined
	paramsToObject?: undefined
	objectToParams?: undefined
}
interface RouteConfigWithMapping<N, T extends {} = any> {
	path: string
	encodeParams?: (name: keyof T, value: string) => string
	paramsToObject: (params: T) => { [K in Exclude<keyof N, 'name'>]: N[K] }
	objectToParams: (params: N) => T
}
export type RouteConfig<N> = RouteConfigWithMapping<N> | RouteConfigWithoutMapping
export type RouteMap<N extends RouteName = RouteName> = { [K in N]: RouteConfig<RequestByName<N>> }

export function pathToRequestState(routes: RouteMap, path: string): RequestState | null {
	for (const [name, config] of Object.entries(routes)) {
		const params = matchesPath(config.path, path)
		if (params) {
			const obj = config.paramsToObject ? config.paramsToObject({ ...params }) : params
			return { name: name as RequestState['name'], ...obj } as RequestState
		}
	}
	return null
}

type CacheValue = [pathToRegexp.Key[], RegExp]
const compiledRoutesCache = new Map<string, CacheValue>()
type StringObject = { [key: string]: string }

export function matchesPath(path: string, url: string): StringObject | null {
	let keys: pathToRegexp.Key[] = []
	let regexp: RegExp
	if (compiledRoutesCache.has(path)) {
		;[keys, regexp] = compiledRoutesCache.get(path) as CacheValue
	} else {
		regexp = pathToRegexp(path, keys)
		compiledRoutesCache.set(path, [keys, regexp])
	}
	const match = regexp.exec(url)
	if (match) {
		return match.slice(1).reduce((acc, value, i) => ({ ...acc, [keys[i].name]: value }), {})
	}
	return null
}

export function requestStateToPath(routes: RouteMap, state: RequestState): string {
	const func = routes[state.name].objectToParams
	const params = func ? func(state) : state
	return pathToRegexp.compile(routes[state.name].path)(params, {
		encode: (val, token) => {
			const encodeParams =
				routes[state.name].encodeParams || ((name: unknown, value: string) => encodeURIComponent(value))
			return encodeParams(token.name, val)
		},
	})
}
