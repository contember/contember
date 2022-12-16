import * as pathToRegexp from 'path-to-regexp'
import { MatchFunction, PathFunction } from 'path-to-regexp'
import { Environment } from '@contember/binding'
import { RoutingContextValue } from './RoutingContext'
import { RequestState } from './types'

const matchFunctionsCache: Record<string, MatchFunction> = {}
const pathFunctionsCache: Record<string, PathFunction> = {}
const pathKeysCache: Record<string, string[]> = {}

export const dimensionsIn = (dimensions: string): Environment.SelectedDimensions => {
	return dimensions
		.split('+')
		.map((pair: string) => pair.split('='))
		.reduce((acc, [key, value]) => ({ ...acc, [key]: value.split(',') }), {})
}

export const dimensionsOut = (dimensions: Environment.SelectedDimensions): string => {
	return Object.entries(dimensions)
		.map(([key, value]) => `${key}=${value.join(',')}`)
		.join('+')
}

export const pageNameIn = (pageName: string): string => {
	return pageName.replace(/-([a-z])/g, m => m[1].toUpperCase())
}

export const pageNameOut = (pageName: string): string => {
	return pageName.replace(/([A-Z])/g, '-$1').toLowerCase()
}

const parseQuery = (query: string): Record<string, string | number> => {
	const searchParams = new URLSearchParams(query)

	return Object.fromEntries(Array.from(
		searchParams,
		([key, val]) => [key, parseInt(val, 10).toString() === val ? parseInt(val, 10) : val]),
	)
}

export const pathToRequestState = (routing: RoutingContextValue, path: string, query: string): RequestState => {
	if (!path.startsWith(routing.basePath.slice(0, -1))) {
		return null
	}

	const dimensionsSegment = path.slice(routing.basePath.length, path.indexOf('/', routing.basePath.length))
	const hasDimensions = dimensionsSegment.includes('=')

	const dimensions = hasDimensions ? dimensionsIn(dimensionsSegment) : routing.defaultDimensions
	const pagePath = hasDimensions ? path.slice(routing.basePath.length + dimensionsSegment.length) : path.slice(routing.basePath.length - 1)
	const pagePathNormalized = pagePath.endsWith('/') ? pagePath : `${pagePath}/`

	for (const [pageName, config] of Object.entries(routing.routes)) {
		matchFunctionsCache[config.path] ??= pathToRegexp.match(config.path, { decode: decodeURIComponent })
		const matchResult = matchFunctionsCache[config.path](pagePathNormalized)

		if (matchResult !== false) {
			const queryParameters = parseQuery(query)
			const pathParameters = config.paramsToObject ? config.paramsToObject(matchResult.params) : matchResult.params
			const parameters = { ...queryParameters, ...pathParameters }

			return {
				pageName,
				parameters,
				dimensions: dimensions ?? {},
			}
		}
	}

	const parameters = parseQuery(query)
	let pageName: string

	if (routing.pageInQuery) {
		pageName = typeof parameters.page === 'string' ? parameters.page : 'index'
		delete parameters.page

	} else {
		pageName = pageNameIn(pagePathNormalized.slice(1, -1))
	}

	return {
		pageName,
		parameters,
		dimensions: dimensions ?? {},
	}
}

export const requestStateToPath = (routing: RoutingContextValue, request: RequestState): string => {
	if (request === null) {
		throw new PageNotFound(`Unable to generate URL for empty request`)
	}

	const dimensionsString = dimensionsOut(request.dimensions)
	const dimensionsSegment = dimensionsString ? `/${dimensionsString}` : ''
	const prefix = routing.basePath.slice(0, -1) + dimensionsSegment

	let pathSegment: string
	const query = new URLSearchParams(request.parameters as Record<string, string>)

	if (!routing.routes[request.pageName]) {
		pathSegment = routing.pageInQuery ? '' : '/' + pageNameOut(request.pageName)

		if (routing.pageInQuery && request.pageName !== 'index') {
			query.append('page', request.pageName)
		}

	} else {
		const route = routing.routes[request.pageName]
		const pathParameters = route.objectToParams ? route.objectToParams(request.parameters) : request.parameters

		pathFunctionsCache[route.path] ??= pathToRegexp.compile(route.path, { encode: encodeURIComponent })
		pathSegment = pathFunctionsCache[route.path](pathParameters)

		pathKeysCache[route.path] ??= pathToRegexp.parse(route.path).flatMap(it => typeof it !== 'string' && typeof it.name === 'string' ? [it.name] : [])
		pathKeysCache[route.path].forEach(key => query.delete(key))
	}

	const queryString = query.toString()
	const querySegment = queryString ? `?${queryString}` : ''

	return (prefix + pathSegment + querySegment) || '/'
}

export class PageNotFound extends Error {
	constructor(reason?: string) {
		super('Page not found' + (reason && ': ' + reason))
	}
}
