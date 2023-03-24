import { intersection, literal, object, ParseError, partial, string, union } from './utils/schema'

const Env = intersection(
	object({
		NODE_ENV: union(literal('development'), literal('production')),
		CONTEMBER_PORT: string,

		CONTEMBER_API_ENDPOINT: string,
		CONTEMBER_LOGIN_TOKEN: string,
		CONTEMBER_PUBLIC_DIR: string,

		CONTEMBER_S3_ENDPOINT: string,
		CONTEMBER_S3_REGION: string,
		CONTEMBER_S3_BUCKET: string,
		CONTEMBER_S3_PREFIX: string,
		CONTEMBER_S3_KEY: string,
		CONTEMBER_S3_SECRET: string,
	}),
	partial({
		CONTEMBER_API_HOSTNAME: string,
		CONTEMBER_PROJECT_GROUP_DOMAIN_MAPPING: string,
		CONTEMBER_INVITE_METHOD: union(literal('CREATE_PASSWORD'), literal('RESET_PASSWORD')),
		CONTEMBER_CUSTOM_CONFIG: string,

		REDIS_HOST: string,
		REDIS_PREFIX: string,
	}),
)

export const env = () => {
	try {
		return Env(process.env)
	} catch (e) {
		if (e instanceof ParseError) {
			throw new Error(`Invalid environment variables: ${e.message}`)
		} else {
			throw e
		}
	}
}
