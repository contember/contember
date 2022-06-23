import { ProjectGroupContainerResolver } from '../projectGroup/ProjectGroupContainerResolver.js'
import { Registry } from 'prom-client'
import { createDbMetricsRegistrar } from '../utils/index.js'

export class ProjectGroupContainerMetricsHook {
	constructor(
		private containerResolver: ProjectGroupContainerResolver,
	) {
	}

	public register(promRegistry: Registry) {
		const registrar = createDbMetricsRegistrar(promRegistry)
		this.containerResolver.onCreate.push((groupContainer, slug) => {
			groupContainer.projectContainerResolver.onCreate.push(projectContainer =>
				registrar({
					connection: projectContainer.connection,
					labels: {
						contember_module: 'content',
						contember_project: projectContainer.project.slug,
						contember_project_group: slug ?? 'unknown',
					},
				}),
			)
			return registrar({
				connection: groupContainer.tenantContainer.connection,
				labels: {
					contember_module: 'tenant',
					contember_project_group: slug ?? 'unknown',
					contember_project: 'unknown',
				},
			})
		})
	}
}
