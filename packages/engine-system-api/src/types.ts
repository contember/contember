export interface ProjectConfig {
	slug: string
	stages: StageConfig[]
	directory?: string
}

export interface StageConfig {
	slug: string
	name: string
}
