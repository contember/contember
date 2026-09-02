import { Tracer } from '@contember/telemetry'
import { ProjectGroupContainer } from '../projectGroup/ProjectGroupContainer.js'
import { ProjectGroupContainerResolver } from '../projectGroup/ProjectGroupContainerResolver.js'
import { createSqlSpansRegistrar } from './sqlSpans.js'

export interface SqlSpansConfig {
	enabled?: boolean
	includeQueryText?: boolean
}

export class ProjectGroupContainerTelemetryHook {
	private registered = false
	private readonly registeredContainers = new WeakSet<ProjectGroupContainer>()

	constructor(
		private readonly containerResolver: ProjectGroupContainerResolver,
		private readonly tracer: Tracer,
		private readonly config: SqlSpansConfig | undefined,
	) {
	}

	public register(): void {
		if (this.config?.enabled === false || this.registered) {
			return
		}
		this.registered = true
		this.containerResolver.on('create', ({ container: groupContainer, slug }) => {
			return this.registerContainer(groupContainer, slug)
		})
	}

	public registerContainer(groupContainer: ProjectGroupContainer, slug: string | undefined = groupContainer.slug): () => void {
		if (this.config?.enabled === false || this.registeredContainers.has(groupContainer)) {
			return () => {}
		}
		this.registeredContainers.add(groupContainer)
		const registrar = createSqlSpansRegistrar(this.tracer, { includeQueryText: this.config?.includeQueryText ?? false })
		const projectGroup = slug ?? 'unknown'

		const unlisten = groupContainer.projectContainerResolver.on('create', ({ container: projectContainer }) => {
			const primaryConnection = projectContainer.connection
			const readConnection = projectContainer.readConnection
			const hasReplica = primaryConnection !== readConnection
			const labels = { module: 'content', project: projectContainer.project.slug, projectGroup }
			const unregister = [registrar(primaryConnection, { ...labels, instance: hasReplica ? 'primary' : 'single' })]
			if (hasReplica) {
				unregister.push(registrar(readConnection, { ...labels, instance: 'replica' }))
			}
			return () => unregister.forEach(it => it())
		})

		const primaryConnection = groupContainer.tenantContainer.connection
		const readConnection = groupContainer.tenantContainer.readConnection
		const hasReplica = primaryConnection !== readConnection
		const labels = { module: 'tenant', project: 'unknown', projectGroup }
		const unregister = [registrar(primaryConnection, { ...labels, instance: hasReplica ? 'primary' : 'single' })]
		if (hasReplica) {
			unregister.push(registrar(readConnection, { ...labels, instance: 'replica' }))
		}

		return () => {
			this.registeredContainers.delete(groupContainer)
			unlisten()
			unregister.forEach(it => it())
		}
	}
}
