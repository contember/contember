export interface ProjectConfig {
	slug: string
	stages: StageConfig[]
	systemSchema: string
	directory?: string
}

export interface StageConfig {
	slug: string
	name: string
	schema?: string
}
