import * as pathToRegexp from 'path-to-regexp'
import { RouteMap, matchesPath } from './utils/url'
import { ProjectConfig } from './state/projectsConfigs'

export default (map: ProjectConfig[]): RouteMap => {
	const configResolver = (project: string, stage: string) => map.find(c => c.project === project && c.stage === stage)
	return {
		login: { path: '/' },
		project_page: {
			path: '/p/:project/:stage/:path(.*)',
			paramsToObject: ({ project, stage, path }) => {
				const configMap = configResolver(project, stage)
				if (!configMap) {
					throw new PageNotFound('No such project')
				}

				for (const [name, config] of Object.entries(configMap.routes)) {
					const params = matchesPath(config.path, '/' + path)
					if (params) {
						const obj = config.paramsToObject ? config.paramsToObject({ ...params }) : params
						return { pageName: name, parameters: obj, project, stage }
					}
				}

				throw new PageNotFound()
			},
			objectToParams: ({ project, stage, pageName, parameters }: any) => {
				const configMap = configResolver(project, stage)
				if (!configMap || !configMap.routes[pageName]) {
					throw new PageNotFound(`No such project or page as ${pageName} in ${project}/${stage}`)
				}
				const func = configMap.routes[pageName].objectToParams
				const params = func ? func(parameters) : parameters
				return {
					path: pathToRegexp
						.compile(configMap.routes[pageName].path)(params)
						.slice(1),
					project,
					stage
				}
			}
		}
	}
}

export class PageNotFound extends Error {
	constructor(reason?: string) {
		super('Page not found' + (reason && ': ' + reason))
	}
}
