export const configTemplate: any = {
	tenant: {
		db: {
			host: `%tenant.env.DB_HOST%`,
			port: `%tenant.env.DB_PORT::number%`,
			user: `%tenant.env.DB_USER%`,
			password: `%tenant.env.DB_PASSWORD%`,
			database: `%tenant.env.DB_NAME%`,
			ssl: `%?tenant.env.DB_SSL::bool%`,
		},
		mailer: {
			from: '%?tenant.env.MAILER_FROM%',
			host: '%?tenant.env.MAILER_HOST::string%',
			port: '%?tenant.env.MAILER_PORT::number%',
			secure: '%?tenant.env.MAILER_SECURE::bool%',
			user: '%?tenant.env.MAILER_USER%',
			password: '%?tenant.env.MAILER_PASSWORD%',
		},
		credentials: {
			rootEmail: '%?env.CONTEMBER_ROOT_EMAIL%',
			rootToken: '%?env.CONTEMBER_ROOT_TOKEN%',
			rootTokenHash: '%?env.CONTEMBER_ROOT_TOKEN_HASH%',
			rootPassword: '%?env.CONTEMBER_ROOT_PASSWORD%',
			loginToken: '%?env.CONTEMBER_LOGIN_TOKEN%',
		},
		secrets: {
			encryptionKey: '%?env.CONTEMBER_ENCRYPTION_KEY%',
		},
	},
	projectDefaults: {
		db: {
			host: `%?project.env.DB_HOST%`,
			port: `%?project.env.DB_PORT::number%`,
			user: `%?project.env.DB_USER%`,
			password: `%?project.secret.db.password||project.env.DB_PASSWORD%`,
			database: `%?project.env.DB_NAME||project.slug%`,
			ssl: `%?project.env.DB_SSL::bool%`,
		},
	},
	server: {
		port: '%env.CONTEMBER_PORT::number%',
		monitoringPort: '%env.CONTEMBER_MONITORING_PORT::number%',
		workerCount: '%?env.CONTEMBER_WORKER_COUNT::string%',
		http: {
			requestBodySize: '%?env.CONTEMBER_HTTP_REQUEST_BODY_SIZE::string%',
		},
		projectGroup: {
			domainMapping: '%?env.CONTEMBER_PROJECT_GROUP_DOMAIN_MAPPING%',
			configHeader: '%?env.CONTEMBER_PROJECT_GROUP_CONFIG_HEADER%',
			configEncryptionKey: '%?env.CONTEMBER_PROJECT_GROUP_CONFIG_ENCRYPTION_KEY%',
		},
		logging: {
			sentry: {
				dsn: '%?env.SENTRY_DSN%',
			},
		},
	},
}
