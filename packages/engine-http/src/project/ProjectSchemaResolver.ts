import { ProjectSchemaResolver as ProjectSchemaResolverInterface } from '@contember/engine-tenant-api'
import { Schema } from '@contember/schema'
import { ProjectContainerResolver } from './ProjectContainerResolver'

export class ProjectSchemaResolver implements ProjectSchemaResolverInterface {
	constructor(
		private readonly projectContainerResolver: ProjectContainerResolver,
	) {}

	async getSchema(slug: string): Promise<Schema | undefined> {
		const container = await this.projectContainerResolver.getProjectContainer(slug)
		if (!container) {
			return undefined
		}
		const db = container.systemReadDatabaseContext
		return (await container.contentSchemaResolver.getSchema({ db, normalize: true }))?.schema
	}
}

export class ProjectSchemaResolverProxy implements ProjectSchemaResolverInterface {
	private resolver: ProjectSchemaResolver | undefined

	setResolver(resolver: ProjectSchemaResolver): void {
		this.resolver = resolver
	}

	async getSchema(projectSlug: string): Promise<Schema | undefined> {
		if (!this.resolver) {
			throw new Error('Resolved is not set')
		}
		return this.resolver.getSchema(projectSlug)
	}
}
