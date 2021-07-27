import { Schema } from '@contember/schema'

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

export type ProjectSchemaResolver = (projectSlug: string) => Promise<Schema | undefined>
export type ProjectInitializer = (project: ProjectWithSecrets) => Promise<{ log: string[] }>
