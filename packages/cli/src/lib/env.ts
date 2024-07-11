export interface CliEnv {
	apiToken?: string
	loginToken?: string
	apiUrl?: string
	projectName?: string
	dockerComposeFile?: string
	dsn?: string
	dir?: string
}

export const readCliEnv = (): CliEnv => {
	return {
		dir: process.env.CONTEMBER_DIR,
		apiToken: process.env.CONTEMBER_API_TOKEN,
		loginToken: process.env.CONTEMBER_LOGIN_TOKEN,
		apiUrl: process.env.CONTEMBER_API_URL ?? process.env.CONTEMBER_INSTANCE,
		projectName: process.env.CONTEMBER_PROJECT_NAME,
		dockerComposeFile: process.env.COMPOSE_FILE,
		dsn: process.env.CONTEMBER_DSN,
	}
}
