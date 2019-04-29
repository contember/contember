interface Project {
	readonly id: string
	readonly slug: string
	readonly name: string
	readonly stages: Array<Project.Stage>
	readonly dbCredentials: Project.DatabaseCredentials
	readonly s3: Project.S3Config
}

namespace Project {
	export interface Stage {
		readonly id: string
		readonly slug: string
		readonly name: string
		readonly base?: string
	}

	export interface DatabaseCredentials {
		readonly host: string
		readonly port: number
		readonly user: string
		readonly password: string
		readonly database: string
	}

	export interface S3Config {
		readonly bucket: string
		readonly region: string
		readonly prefix: string
		readonly endpoint?: string
		readonly credentials: {
			readonly key: string
			readonly secret: string
		}
	}
}

export default Project
