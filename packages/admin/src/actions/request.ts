import { createAction } from 'redux-actions'
import { REQUEST_REPLACE } from '../reducer/request'
import { PageNotFound } from '../routes'
import type { default as RequestState, PageRequest, RequestChange } from '../state/request'
import type ViewState from '../state/view'
import handleRequest from './requestHandler'
import type { ActionCreator } from './types'
import { matchesPath } from '../utils'
import type { ProjectConfig } from '../state/projectsConfigs'
import * as pathToRegexp from 'path-to-regexp'

const pathToRequestStateX = (projectConfig: ProjectConfig, path: string): PageRequest<any> | null => {
	for (const [name, config] of Object.entries(projectConfig.routes)) {
		const params = matchesPath(config.path, path)

		if (params !== null) {
			return {
				name: 'project_page',
				pageName: name,
				parameters: config.paramsToObject ? config.paramsToObject({ ...params }) : params,
				project: projectConfig.project,
				stage: projectConfig.stage,
				dimensions: projectConfig.defaultDimensions ?? {}, // TODO: parse dimensions from request
			}
		}
	}

	return null
}

const requestStateToPathX = (projectConfig: ProjectConfig, request: PageRequest<any>): string => {
	if (!projectConfig.routes[request.pageName]) {
		throw new PageNotFound(`No such project or page as ${request.pageName} in ${projectConfig.project}/${projectConfig.stage}`)
	}

	const route = projectConfig.routes[request.pageName]
	const pathParameters = route.objectToParams ? route.objectToParams(request.parameters) : request.parameters

	return pathToRegexp.compile(route.path)(pathParameters)
}

export const pushRequest =
	(requestChange: RequestChange): ActionCreator<ViewState> =>
	(dispatch, getState) => {
		const basePath = getState().basePath
		const previousRequest = getState().request
		const request: RequestState = { ...requestChange(previousRequest) }
		dispatch(createAction(REQUEST_REPLACE, () => request)())

		const projectConfig = getState().projectConfig

		window.history.pushState(
			{},
			document.title,
			basePath + requestStateToPathX(projectConfig, request as any), // TODO
		)
		return dispatch(handleRequest(request, previousRequest))
	}

export const populateRequest =
	(location: Location): ActionCreator<ViewState> =>
	(dispatch, getState) => {
		const basePath = getState().basePath

		if (!location.pathname.startsWith(basePath)) {
			throw new PageNotFound('No matching route found (wrong basePath)')
		}

		const projectConfig = getState().projectConfig
		const path = location.pathname.substring(basePath.length)

		const request = pathToRequestStateX(projectConfig, path)

		if (!request) {
			throw new PageNotFound('No matching route found')
		}

		// Replace with canonical version of the url
		const canonicalPath = basePath + requestStateToPathX(projectConfig, request)
		if (canonicalPath !== location.pathname) {
			window.history.replaceState({}, document.title, canonicalPath)
		}

		const previousRequest = getState().request
		dispatch(createAction(REQUEST_REPLACE, () => request)())
		return dispatch(handleRequest(request, previousRequest))
	}
