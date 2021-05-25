import * as pathToRegexp from 'path-to-regexp'
import type { ProjectConfig } from './state/projectsConfigs'
import { toObject as parseDimensionsString, toString as dimensionsStringify } from './utils/stringifyDimensions'
import { matchesPath, RouteMap } from './utils/url'

export default (map: ProjectConfig[]): RouteMap => {
	const configResolver = (project: string, stage: string) => map.find(c => c.project === project && c.stage === stage)
	return {
		login: { path: '/' },
		projects_list: { path: '/projects' },
		project_page: {
			path: '/p/:project/:stage/:dimensions/:path(.*)',
			encodeParams: (name, value) => {
				switch (name) {
					case 'path':
					case 'dimensions':
						return value

					default:
						return encodeURIComponent(value)
				}
			},
			paramsToObject: ({ project, stage, path, dimensions }: { [key: string]: string }) => {
				const configMap = configResolver(project, stage)
				if (!configMap) {
					throw new PageNotFound('No such project')
				}

				const parsedDimensions = parseDimensionsString(dimensions, configMap.defaultDimensions || {})

				for (const [name, config] of Object.entries(configMap.routes)) {
					const params = matchesPath(config.path, '/' + path)
					if (params) {
						const obj = config.paramsToObject ? config.paramsToObject({ ...params }) : params
						return { pageName: name, parameters: obj, project, stage, dimensions: parsedDimensions }
					}
				}

				throw new PageNotFound()
			},
			objectToParams: ({ project, stage, pageName, parameters, dimensions }: any) => {
				const configMap = configResolver(project, stage)
				if (!configMap || !configMap.routes[pageName]) {
					throw new PageNotFound(`No such project or page as ${pageName} in ${project}/${stage}`)
				}

				const dimensionsStr = dimensionsStringify(dimensions)

				const func = configMap.routes[pageName].objectToParams
				const params = func ? func(parameters) : parameters
				return {
					path: pathToRegexp.compile(configMap.routes[pageName].path)(params).slice(1),
					project,
					stage,
					dimensions: dimensionsStr,
				}
			},
		},
	}
}

export class PageNotFound extends Error {
	constructor(reason?: string) {
		super('Page not found' + (reason && ': ' + reason))
	}
}
