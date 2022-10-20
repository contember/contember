import * as Typesafe from '@contember/typesafe'
import { MailerOptions } from '@contember/engine-tenant-api'
import { upperCaseFirst } from '../utils/strings'


const dbConfigRequired = {
	host: Typesafe.string,
	port: Typesafe.number,
	user: Typesafe.string,
	password: Typesafe.string,
	database: Typesafe.string,
}
const dbConfigOptional = {
	ssl: Typesafe.boolean,
	queryTimeoutMs: Typesafe.number,
	statementTimeoutMs: Typesafe.number,
	connectionTimeoutMs: Typesafe.number,
	pool: Typesafe.partial({
		maxConnections: Typesafe.number,
		maxConnecting: Typesafe.number,
		maxIdle: Typesafe.number,
		reconnectIntervalMs: Typesafe.number,
		idleTimeoutMs: Typesafe.number,
		acquireTimeoutMs: Typesafe.number,
		maxUses: Typesafe.number,
		maxAgeMs: Typesafe.number,
	}),
}

const dbConfigSchemaInner = Typesafe.intersection(
	Typesafe.object(dbConfigRequired),
	Typesafe.partial(dbConfigOptional),
)

const readDbSchema = Typesafe.intersection(
	Typesafe.partial(dbConfigRequired),
	Typesafe.partial(dbConfigOptional),
)

export const dbConfigSchema = Typesafe.intersection(
	dbConfigSchemaInner,
	Typesafe.partial({
		read: (val: unknown) => {
			const readDb = readDbSchema(val)
			if ('host' in readDb) {
				return readDb
			}
			return undefined
		},
	}),
)

export const tenantConfigSchema = Typesafe.intersection(
	Typesafe.object({
		db: dbConfigSchema,
		mailer: Typesafe.transform(Typesafe.partial({
			from: Typesafe.string,
			host: Typesafe.string,
			port: Typesafe.number,
			user: Typesafe.string,
			password: Typesafe.string,
		}), (value, input): MailerOptions & Typesafe.JsonObject => {
			return {
				...(input as any),
				...value,
				...(value.user ? { auth: { user: value.user, pass: value.password } } : {}),
			}
		}),
		credentials: Typesafe.partial({
			rootToken: Typesafe.string,
			rootTokenHash: Typesafe.string,
			rootPassword: Typesafe.string,
			rootEmail: Typesafe.string,
			loginToken: Typesafe.string,
		}),
	}),
	Typesafe.object({
		secrets: Typesafe.partial({
			encryptionKey: Typesafe.string,
		}),
	}),
)

export const serverConfigSchema = Typesafe.object({
	port: Typesafe.number,
	http: Typesafe.partial({
		requestBodySize: Typesafe.string,
	}),
	logging: Typesafe.union(
		(val): { sentry?: { dsn: string } } => Typesafe.valueAt(val, ['sentry', 'dsn']) === undefined ? {} : Typesafe.fail([]),
		Typesafe.partial({
			sentry: Typesafe.object({
				dsn: Typesafe.string,
			}),
		}),
	),
})

export const stageConfig = Typesafe.record(
	Typesafe.string,
	Typesafe.intersection(
		Typesafe.object({
			name: Typesafe.union(
				Typesafe.string,
				(_: unknown, path: PropertyKey[] = []) => upperCaseFirst(String(path[path.length - 2])),
			),
			slug: (_: unknown, path: PropertyKey[] = []) => String(path[path.length - 2]),
		}),
		Typesafe.partial({
			schema: Typesafe.string,
		}),
	),
)

export const projectConfigSchema = Typesafe.object({
	name: Typesafe.union(
		Typesafe.string,
		(_: unknown, path: PropertyKey[] = []) => upperCaseFirst(String(path[path.length - 2])).replace(/-/g, ' '),
	),
	slug: (_, path = []) => String(path[path.length - 2]),
	stages: (input, path = []) => Object.values(stageConfig(input, path)),
	db: Typesafe.intersection(
		Typesafe.union(
			Typesafe.object({
				useTenantDb: Typesafe.literal(true),
			}),
			dbConfigSchema,
		),
		Typesafe.partial({
			systemSchema: Typesafe.string,
		}),
	),
})
