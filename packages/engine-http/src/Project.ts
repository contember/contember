import { DatabaseCredentials } from '@contember/database'

type Project = {
	readonly slug: string
	readonly alias?: string[]
	readonly directory?: string
	readonly name: string
	readonly stages: Array<Project.Stage>
	readonly db: DatabaseCredentials
} & Record<string, unknown>

namespace Project {
	export interface Stage {
		readonly slug: string
		readonly name: string
		readonly base?: string
	}
}

export default Project
