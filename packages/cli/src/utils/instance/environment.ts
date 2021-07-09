export type InstanceApiEnvironment = {
	baseUrl: string
}

export const getInstanceFromEnv = (): string | undefined => {
	return process.env.CONTEMBER_INSTANCE
}
