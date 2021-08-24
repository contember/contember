import { RequestState } from '../state/request'
import * as pathToRegexp from 'path-to-regexp'
import { MatchFunction, PathFunction } from 'path-to-regexp'
import { Environment } from '@contember/binding'
import { RoutingContextValue } from './RoutingContext'

const matchFunctionsCache: Record<string, MatchFunction> = {}
const pathFunctionsCache: Record<string, PathFunction> = {}

export const parseDimensions = (dimensions: string): Environment.SelectedDimensions => {
	return dimensions
		.split('+')
		.map((pair: string) => pair.split('='))
		.reduce((acc, [key, value]) => ({ ...acc, [key]: value.split(',') }), {})
}

export const stringifyDimensions = (dimensions: Environment.SelectedDimensions): string => {
	return Object.entries(dimensions)
		.map(([key, value]) => `${key}=${value.join(',')}`)
		.join('+')
}

export const pathToRequestState = (routing: RoutingContextValue, path: string): RequestState => {
	if (!path.startsWith(routing.basePath)) {
		return null
	}

	const dimensionSegment = path.split('/')[2] ?? ''
	const hasDimensions = dimensionSegment.includes('=')

	const dimensions = hasDimensions ? parseDimensions(dimensionSegment) : routing.defaultDimensions
	const pagePath = hasDimensions ? path.substring(routing.basePath.length + dimensionSegment.length + 1) : path.substring(routing.basePath.length)

	for (const [pageName, config] of Object.entries(routing.routes)) {
		matchFunctionsCache[config.path] ??= pathToRegexp.match(config.path, { decode: decodeURIComponent })
		const matchResult = matchFunctionsCache[config.path](pagePath)

		if (matchResult !== false) {
			return {
				pageName: pageName,
				parameters: config.paramsToObject ? config.paramsToObject(matchResult.params) : matchResult.params,
				dimensions: dimensions ?? {},
			}
		}
	}

	return null
}

export const requestStateToPath = (routing: RoutingContextValue, request: RequestState): string => {
	if (request === null) {
		throw new PageNotFound(`Unable to generate URL for empty request`)
	}

	if (!routing.routes[request.pageName]) {
		throw new PageNotFound(`No such route for page ${request.pageName}`)
	}

	const dimensionSegment = Object.entries(request.dimensions).length === 0
		? ''
		: `/${stringifyDimensions(request.dimensions)}`

	const route = routing.routes[request.pageName]
	const pathParameters = route.objectToParams ? route.objectToParams(request.parameters) : request.parameters

	pathFunctionsCache[route.path] ??= pathToRegexp.compile(route.path, { encode: encodeURIComponent })
	const pageSegment = pathFunctionsCache[route.path](pathParameters)

	return routing.basePath + dimensionSegment + pageSegment
}

export class PageNotFound extends Error {
	constructor(reason?: string) {
		super('Page not found' + (reason && ': ' + reason))
	}
}
