export const configTemplate: any = {
	tenant: {
		db: {
			host: `%tenant.env.DB_HOST%`,
			port: `%tenant.env.DB_PORT::number%`,
			user: `%tenant.env.DB_USER%`,
			password: `%tenant.env.DB_PASSWORD%`,
			database: `%tenant.env.DB_NAME%`,
			ssl: `%?tenant.env.DB_SSL::bool%`,
			max: '%?tenant.env.DB_POOL_MAX%',
			maxConnecting: '%?tenant.env.DB_POOL_MAX_CONNECTING%',
			maxIdle: '%?tenant.env.DB_POOL_MAX_IDLE%',
			reconnectIntervalMs: '%?tenant.env.DB_POOL_RECONNECT_INTERVAL_MS%',
			idleTimeoutMs: '%?tenant.env.DB_POOL_IDLE_TIMEOUT_MS%',
			acquireTimeoutMs: '%?tenant.env.DB_POOL_ACQUIRE_TIMEOUT_MS%',
			maxUses: '%?tenant.env.DB_POOL_MAX_USES%',
			maxAgeMs: '%?tenant.env.DB_POOL_MAX_AGE_MS%',
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
			max: '%?project.env.DB_POOL_MAX%',
			maxConnecting: '%?project.env.DB_POOL_MAX_CONNECTING%',
			maxIdle: '%?project.env.DB_POOL_MAX_IDLE%',
			reconnectIntervalMs: '%?project.env.DB_POOL_RECONNECT_INTERVAL_MS%',
			idleTimeoutMs: '%?project.env.DB_POOL_IDLE_TIMEOUT_MS%',
			acquireTimeoutMs: '%?project.env.DB_POOL_ACQUIRE_TIMEOUT_MS%',
			maxUses: '%?project.env.DB_POOL_MAX_USES%',
			maxAgeMs: '%?project.env.DB_POOL_MAX_AGE_MS%',
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
