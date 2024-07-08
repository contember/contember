import { Registry } from 'prom-client'
import { ProjectGroupContainerResolver } from '../projectGroup/ProjectGroupContainerResolver'
import { createDbMetricsRegistrar } from './dbMetrics'

export class ProjectGroupContainerMetricsHook {
	constructor(
		private containerResolver: ProjectGroupContainerResolver,
	) {
	}

	public register(promRegistry: Registry) {
		const registrar = createDbMetricsRegistrar(promRegistry)
		this.containerResolver.on('create', ({ container: groupContainer, slug }) => {
			groupContainer.projectContainerResolver.on('create', ({ container: projectContainer }) => {
				const primaryConnection = projectContainer.connection
				const readConnection = projectContainer.readConnection
				const hasDifferentReadConnection = primaryConnection !== readConnection
				const unregister: (() => void)[] = []
				unregister.push(registrar({
					connection: primaryConnection,
					labels: {
						contember_module: 'content',
						contember_project: projectContainer.project.slug,
						contember_project_group: slug ?? 'unknown',
						database_instance: hasDifferentReadConnection ? 'primary' : 'single',
					},
				}))
				if (hasDifferentReadConnection) {
					unregister.push(registrar({
						connection: readConnection,
						labels: {
							contember_module: 'content',
							contember_project: projectContainer.project.slug,
							contember_project_group: slug ?? 'unknown',
							database_instance: 'replica',
						},
					}))
				}
				return () => unregister.forEach(it => it())
			})


			const primaryConnection = groupContainer.tenantContainer.connection
			const readConnection = groupContainer.tenantContainer.readConnection
			const hasDifferentReadConnection = primaryConnection !== readConnection
			const unregister: (() => void)[] = []
			unregister.push(registrar({
				connection: primaryConnection,
				labels: {
					contember_module: 'tenant',
					contember_project_group: slug ?? 'unknown',
					contember_project: 'unknown',
					database_instance: hasDifferentReadConnection ? 'primary' : 'single',
				},
			}))
			if (hasDifferentReadConnection) {
				unregister.push(registrar({
					connection: readConnection,
					labels: {
						contember_module: 'tenant',
						contember_project_group: slug ?? 'unknown',
						contember_project: 'unknown',
						database_instance: 'replica',
					},
				}))
			}

			return () => unregister.forEach(it => it())
		})
	}
}
