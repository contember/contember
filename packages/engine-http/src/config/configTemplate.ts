const createDbConfigTemplate = (prefix: string) => {
	return {
		ssl: `%?${prefix}_SSL::bool%`,
		queryTimeoutMs: `%?${prefix}_QUERY_TIMEOUT_MS::number%`,
		statementTimeoutMs: `%?${prefix}_STATEMENT_TIMEOUT_MS::number%`,
		connectionTimeoutMs: `%?${prefix}_CONNECTION_TIMEOUT_MS::number%`,
		pool: {
			maxConnections: `%?${prefix}_POOL_MAX_CONNECTIONS::number%`,
			maxConnecting: `%?${prefix}_POOL_MAX_CONNECTING::number%`,
			maxIdle: `%?${prefix}_POOL_MAX_IDLE::number%`,
			reconnectIntervalMs: `%?${prefix}_POOL_RECONNECT_INTERVAL_MS::number%`,
			idleTimeoutMs: `%?${prefix}_POOL_IDLE_TIMEOUT_MS::number%`,
			acquireTimeoutMs: `%?${prefix}_POOL_ACQUIRE_TIMEOUT_MS::number%`,
			maxUses: `%?${prefix}_POOL_MAX_USES::number%`,
			maxAgeMs: `%?${prefix}_POOL_MAX_AGE_MS::number%`,
			rateLimitCount: `%?${prefix}_POOL_RATE_LIMIT_COUNT::number%`,
			rateLimitPeriodMs: `%?${prefix}_POOL_RATE_LIMIT_PERIOD_MS::number%`,
		},
	}
}
export const configTemplate: any = {
	tenant: {
		db: {
			host: `%tenant.env.DB_HOST%`,
			port: `%tenant.env.DB_PORT::number%`,
			user: `%tenant.env.DB_USER%`,
			password: `%tenant.env.DB_PASSWORD%`,
			database: `%tenant.env.DB_NAME%`,
			...createDbConfigTemplate('tenant.env.DB'),
			read: {
				host: `%?tenant.env.DB_READ_HOST%`,
				port: `%?tenant.env.DB_READ_PORT::number%`,
				user: `%?tenant.env.DB_READ_USER%`,
				password: `%?tenant.env.DB_READ_PASSWORD%`,
				database: `%?tenant.env.DB_READ_NAME%`,
				...createDbConfigTemplate('tenant.env.DB_READ'),
			},
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
		stageSlug: '%?project.env.STAGE_SLUG%',
		db: {
			host: `%?project.env.DB_HOST%`,
			port: `%?project.env.DB_PORT::number%`,
			user: `%?project.env.DB_USER%`,
			password: `%?project.secret.db.password||project.env.DB_PASSWORD%`,
			database: `%?project.env.DB_NAME||project.slug%`,
			...createDbConfigTemplate('project.env.DB'),
			read: {
				host: `%?project.env.DB_READ_HOST%`,
				port: `%?project.env.DB_READ_PORT::number%`,
				user: `%?project.env.DB_READ_USER%`,
				password: `%?project.secret.db.read.password||project.env.DB_READ_PASSWORD%`,
				database: `%?project.env.DB_READ_NAME%`,
				...createDbConfigTemplate('project.env.DB_READ'),
			},
		},
	},
	server: {
		port: '%env.CONTEMBER_PORT::number%',
		monitoringPort: '%env.CONTEMBER_MONITORING_PORT::number%',
		workerCount: '%?env.CONTEMBER_WORKER_COUNT::string%',
		applicationWorker: '%?env.CONTEMBER_APPLICATION_WORKER::string%',
		http: {
			requestBodySize: '%?env.CONTEMBER_HTTP_REQUEST_BODY_SIZE::string%',
		},
		contentApi: {
			schemaCacheTtlSeconds: '%?env.CONTEMBER_CONTENT_API_SCHEMA_CACHE_TTL_SECONDS::number%',
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
