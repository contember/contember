import { expect, it } from 'bun:test'
import { createTenantConfigResolver } from '../../../src/config/tenantConfigResolver'
import { configTemplate } from '../../../src/config/configTemplate'
import { createProjectConfigResolver } from '../../../src/config/projectConfigResolver'

const assert = {
	deepEqual: (a: any, b: any) => expect(a).toStrictEqual(b),
}
const env = {
	DEFAULT_DB_POOL_IDLE_TIMEOUT_MS: '60000',
	DEFAULT_DB_POOL_MAX_CONNECTIONS: '1000',
	DEFAULT_DB_POOL_MAX_CONNECTING: '10',
	DEFAULT_DB_CONNECTION_TIMEOUT_MS: '5000',
}
const tenantConfig = {
	db: {
		host: 'c0.cluster-abc.eu-west-1.rds.amazonaws.com',
		port: 5432,
		user: 'u_test_e',
		password: 'PASSWD',
		database: 'p_test_e',
		read: { host: 'c0.cluster-ro-abc.eu-west-1.rds.amazonaws.com' },
	},
}
it('resolves tenant config', () => {
	const tenantResolver = createTenantConfigResolver(env, configTemplate.tenant)
	const resolvedTenantConfig = tenantResolver('test', tenantConfig)
	assert.deepEqual(resolvedTenantConfig, {
		db: {
			host: 'c0.cluster-abc.eu-west-1.rds.amazonaws.com',
			port: 5432,
			user: 'u_test_e',
			password: 'PASSWD',
			database: 'p_test_e',
			connectionTimeoutMs: 5000,
			pool: { maxConnections: 1000, maxConnecting: 10, idleTimeoutMs: 60000 },
			read: {
				host: 'c0.cluster-ro-abc.eu-west-1.rds.amazonaws.com',
				pool: {},
			},
		},
		mailer: {},
		credentials: {},
		secrets: {},
	})
})
it('resolves tenant config with group slug env prefix', () => {
	const envWithGroup = {
		...env,
		TENANT_DB_HOST: 'default-db.example.com',
		TENANT_DB_PORT: '5432',
		TENANT_DB_USER: 'default_user',
		TENANT_DB_PASSWORD: 'default_pass',
		TENANT_DB_NAME: 'default_db',
		STAGE_TENANT_DB_HOST: 'stage-db.example.com',
		STAGE_TENANT_DB_NAME: 'stage_db',
	}
	const tenantResolver = createTenantConfigResolver(envWithGroup, configTemplate.tenant)
	const resolvedTenantConfig = tenantResolver('stage', {})
	assert.deepEqual(resolvedTenantConfig, {
		db: {
			host: 'stage-db.example.com',
			port: 5432,
			user: 'default_user',
			password: 'default_pass',
			database: 'stage_db',
			connectionTimeoutMs: 5000,
			pool: { maxConnections: 1000, maxConnecting: 10, idleTimeoutMs: 60000 },
		},
		mailer: {},
		credentials: {},
		secrets: {},
	})
})

it('resolves tenant config with group slug falling back to unprefixed', () => {
	const envWithGroup = {
		...env,
		TENANT_DB_HOST: 'default-db.example.com',
		TENANT_DB_PORT: '5432',
		TENANT_DB_USER: 'default_user',
		TENANT_DB_PASSWORD: 'default_pass',
		TENANT_DB_NAME: 'default_db',
	}
	const tenantResolver = createTenantConfigResolver(envWithGroup, configTemplate.tenant)
	const resolvedTenantConfig = tenantResolver('prod', {})
	assert.deepEqual(resolvedTenantConfig, {
		db: {
			host: 'default-db.example.com',
			port: 5432,
			user: 'default_user',
			password: 'default_pass',
			database: 'default_db',
			connectionTimeoutMs: 5000,
			pool: { maxConnections: 1000, maxConnecting: 10, idleTimeoutMs: 60000 },
		},
		mailer: {},
		credentials: {},
		secrets: {},
	})
})

it('resolves project config', () => {
	const tenantResolver = createTenantConfigResolver(env, configTemplate.tenant)
	const resolvedTenantConfig = tenantResolver('test', tenantConfig)

	const projectConfigResolver = createProjectConfigResolver(env, configTemplate, [])
	const resolvedProjectConfig = projectConfigResolver(
		'test-p',
		{
			db: {
				useTenantDb: true,
				systemSchema: 'system_test_e',
			},
			s3: { prefix: 'test-e/test-e' },
			stages: { live: { schema: 'content_test_e_live' } },
		},
		{},
		resolvedTenantConfig,
	)

	assert.deepEqual(resolvedProjectConfig as any, {
		name: 'Test p',
		slug: 'test-p',
		stages: [{ name: 'Live', slug: 'live', schema: 'content_test_e_live' }],
		db: {
			host: 'c0.cluster-abc.eu-west-1.rds.amazonaws.com',
			port: 5432,
			user: 'u_test_e',
			password: 'PASSWD',
			database: 'p_test_e',
			connectionTimeoutMs: 5000,
			pool: { maxConnections: 1000, maxConnecting: 10, idleTimeoutMs: 60000 },
			read: {
				host: 'c0.cluster-ro-abc.eu-west-1.rds.amazonaws.com',
				pool: {},
			},
			useTenantDb: true,
			systemSchema: 'system_test_e',
		},
	})
})
