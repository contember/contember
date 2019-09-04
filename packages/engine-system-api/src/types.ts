export interface ProjectConfig {
	slug: string
	stages: StageConfig[]
}

export interface StageConfig {
	slug: string
	name: string
	base?: string
}
