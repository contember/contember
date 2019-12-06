import { DatabaseCredentials } from '@contember/engine-common'

interface Project {
	readonly slug: string
	readonly alias?: string[]
	readonly directory?: string
	readonly name: string
	readonly stages: Array<Project.Stage>
	readonly dbCredentials: DatabaseCredentials
	readonly ignoreMigrations?: boolean
}

namespace Project {
	export interface Stage {
		readonly slug: string
		readonly name: string
		readonly base?: string
	}
}

export default Project
