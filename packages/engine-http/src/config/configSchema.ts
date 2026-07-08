import * as Typesafe from '@contember/typesafe'
import { MailerOptions } from '@contember/engine-tenant-api'
import { upperCaseFirst } from '../utils/strings.js'
import ipaddr from 'ipaddr.js'

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
	lockTimeoutMs: Typesafe.number,
	connectionTimeoutMs: Typesafe.number,
	maxConnectionsPerRequest: Typesafe.number,
	pool: Typesafe.partial({
		maxConnections: Typesafe.number,
		maxConnecting: Typesafe.number,
		maxIdle: Typesafe.number,
		reconnectIntervalMs: Typesafe.number,
		rateLimitCount: Typesafe.number,
		rateLimitPeriodMs: Typesafe.number,
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
		mailer: Typesafe.transform(
			Typesafe.partial({
				from: Typesafe.string,
				host: Typesafe.string,
				port: Typesafe.number,
				user: Typesafe.string,
				password: Typesafe.string,

				webhook: Typesafe.union(
					Typesafe.string,
					Typesafe.intersection(
						Typesafe.object({
							url: Typesafe.string,
						}),
						Typesafe.partial({
							headers: Typesafe.record(Typesafe.string, Typesafe.string),
						}),
					),
				),
			}),
			(value, input): MailerOptions & Typesafe.JsonObject => {
				return {
					...(input as any),
					...value,
					...(value.user ? { auth: { user: value.user, pass: value.password } } : {}),
				}
			},
		),
		credentials: Typesafe.partial({
			rootToken: Typesafe.string,
			rootTokenHash: Typesafe.string,
			rootPassword: Typesafe.string,
			rootEmail: Typesafe.string,
			loginToken: Typesafe.string,
			// Either a JSON array of tokens, or a comma-separated string (for env-based config).
			rootTokens: Typesafe.union(Typesafe.array(Typesafe.string), Typesafe.string),
			rootTokenHashes: Typesafe.union(Typesafe.array(Typesafe.string), Typesafe.string),
		}),
	}),
	Typesafe.object({
		secrets: Typesafe.partial({
			encryptionKey: Typesafe.string,
		}),
	}),
)

export const serverConfigSchema = Typesafe.partial({
	port: Typesafe.number,
	http: Typesafe.partial({
		requestBodySize: Typesafe.string,
		// Allows clients to opt in (via the X-Contember-Force-Ok request header) to receiving HTTP 200
		// for GraphQL API responses, keeping error info in the JSON body. Defaults to enabled; set to
		// false to forbid the header entirely. Accepts boolean-ish strings ('true'/'1'/'on'/...).
		responseStatusHeader: (val: unknown) => {
			if (val === undefined || val === null || val === '') {
				return undefined
			}
			if (val === true || val === 'true' || val === '1' || val === 'on') {
				return true
			}
			if (val === false || val === 'false' || val === '0' || val === 'off') {
				return false
			}
			return Typesafe.fail([])
		},
		suppressAccessLog: (val: unknown) => {
			if (!val) {
				return undefined
			}
			if (val === 'true' || val === '1' || val === 'on') {
				return true
			}
			if (val === 'false' || val === '0' || val === 'off') {
				return false
			}
			if (typeof val === 'string') {
				return val
			}
			Typesafe.fail([])
		},
		trustedProxies: (val: unknown, path: PropertyKey[] = []): string[] | undefined => {
			if (val === undefined || val === null || val === '') {
				return undefined
			}
			const raw = Array.isArray(val) ? val : String(val).split(',')
			const cidrs = raw
				.map(it => String(it).trim())
				.filter(Boolean)
				.map(entry => {
					// Accept both CIDR notation (10.0.0.0/8) and bare addresses (10.0.0.1 → /32, ::1 → /128).
					if (entry.includes('/')) {
						try {
							ipaddr.parseCIDR(entry)
							return entry
						} catch {
							return Typesafe.fail([...path, entry])
						}
					}
					try {
						const addr = ipaddr.parse(entry)
						return `${entry}/${addr.kind() === 'ipv6' ? 128 : 32}`
					} catch {
						return Typesafe.fail([...path, entry])
					}
				})
			return cidrs.length > 0 ? cidrs : undefined
		},
		// A03: name of the trusted reverse-proxy header carrying the client's
		// country (e.g. set by nginx with the GeoIP module). Opt-in — unset means
		// the country signal is never read. Honored only through the same
		// trust_forwarded_info gate as the forwarded IP/User-Agent, so an untrusted
		// client can never spoof it. Header lookup is case-insensitive.
		geoCountryHeader: (val: unknown): string | undefined => {
			if (val === undefined || val === null || val === '') {
				return undefined
			}
			if (typeof val === 'string') {
				return val
			}
			return Typesafe.fail([])
		},
	}),
	contentApi: Typesafe.partial({
		schemaCacheTtlSeconds: Typesafe.integer,
		whereOptimizer: Typesafe.partial({
			disable: Typesafe.boolean,
			maxCrossOptimizationInput: Typesafe.number,
		}),
	}),
	// Consumed by the engine-scheduler plugin. Kept as loose primitives here (engine-http must not
	// depend on the plugin); the plugin validates/normalizes `defaultSchedule` into its Schedule type.
	scheduler: Typesafe.partial({
		enabled: Typesafe.boolean,
		baseTickSeconds: Typesafe.number,
		defaultSchedule: Typesafe.union(
			Typesafe.string,
			Typesafe.partial({
				everySeconds: Typesafe.number,
				everyMinutes: Typesafe.number,
			}),
		),
	}),
	// Consumed by the engine-retention plugin. Kept as loose primitives here (engine-http must not
	// depend on the plugin); the plugin validates/normalizes `defaultSchedule` into its Schedule type.
	retention: Typesafe.partial({
		defaultSchedule: Typesafe.union(
			Typesafe.string,
			Typesafe.partial({
				everySeconds: Typesafe.number,
				everyMinutes: Typesafe.number,
			}),
		),
		batchSize: Typesafe.number,
		maxPerRun: Typesafe.number,
	}),
	logging: Typesafe.union(
		(val): { sentry?: { dsn: string } } => Typesafe.valueAt(val, ['sentry', 'dsn']) === undefined ? {} : Typesafe.fail([]),
		Typesafe.partial({
			sentry: Typesafe.object({
				dsn: Typesafe.string,
			}),
		}),
	),
	projectGroup: (val: unknown, path: PropertyKey[] = []) =>
		Typesafe.valueAt(val, ['domainMapping']) === undefined
			? undefined
			: Typesafe.intersection(
				Typesafe.object({
					domainMapping: Typesafe.string,
				}),
				Typesafe.partial({
					configHeader: Typesafe.string,
					configEncryptionKey: Typesafe.string,
				}),
			)(val, path),
	monitoringPort: Typesafe.number,
	workerCount: Typesafe.union(Typesafe.number, Typesafe.string),
	applicationWorker: Typesafe.string,
	test: Typesafe.partial({
		transactions: Typesafe.boolean,
		transactionTtlSeconds: Typesafe.number,
	}),
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
