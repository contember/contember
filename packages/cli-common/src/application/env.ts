export interface CliEnv {
	apiToken?: string
	loginToken?: string
	apiUrl?: string
	projectName?: string
}
export const readCliEnv = (): CliEnv => {
	return {
		apiToken: process.env.CONTEMBER_API_TOKEN,
		loginToken: process.env.CONTEMBER_LOGIN_TOKEN,
		apiUrl: process.env.CONTEMBER_API_URL ?? process.env.CONTEMBER_INSTANCE,
		projectName: process.env.CONTEMBER_PROJECT_NAME,
	}
}
