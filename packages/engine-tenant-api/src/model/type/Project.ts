import { Schema } from '@contember/schema'
import { DatabaseContext } from '../utils'

export interface Project {
	readonly id: string
	readonly slug: string
	readonly name: string
	readonly config: Record<string, unknown>
}

export interface ProjectGroup {
	slug: string | undefined
	database: DatabaseContext
}


export interface ProjectWithSecrets extends Project {
	readonly secrets: Record<string, string>
	readonly updatedAt: Date
}

export interface ProjectSchemaResolver {
	getSchema(projectGroup: ProjectGroup, projectSlug: string): Promise<Schema | undefined>
}

export interface ProjectInitializer {
	initializeProject(projectGroup: ProjectGroup, project: ProjectWithSecrets): Promise<void>
}
