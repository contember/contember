import { Schema } from 'cms-common'

interface Project {
	readonly uuid: string
	readonly slug: string
	readonly name: string
	readonly stages: Array<Project.Stage>
	readonly dbCredentials: Project.DatabaseCredentials
}

namespace Project {
	export interface Stage {
		readonly uuid: string
		readonly slug: string
		readonly name: string
		readonly schema: Schema
		readonly migration: string
	}

	export interface DatabaseCredentials {
		readonly host: string
		readonly port: number
		readonly user: string
		readonly password: string
		readonly database: string
	}
}

export default Project
