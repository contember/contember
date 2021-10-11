import { Schema } from '@contember/schema'
import { DatabaseContext } from '../utils'

export interface Project {
	readonly id: string
	readonly slug: string
	readonly name: string
	readonly config: Record<string, unknown>
}

export interface ProjectWithSecrets extends Project {
	readonly secrets: Record<string, string>
	readonly updatedAt: Date
}

export interface ProjectSchemaResolver {
	getSchema(tenantDbContext: DatabaseContext, projectSlug: string): Promise<Schema | undefined>
}

export interface ProjectInitializer {
	initializeProject(project: ProjectWithSecrets): Promise<{ log: string[] }>
}
