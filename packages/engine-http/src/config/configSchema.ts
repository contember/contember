import * as Typesafe from '@contember/typesafe'
import { MailerOptions } from '@contember/engine-tenant-api'
import { validateRequestMemoryBudgetOptions } from '@contember/database'
import { upperCaseFirst } from '../utils/strings.js'
import ipaddr from 'ipaddr.js'
import { readFileSync } from 'node:fs'
import { X509Certificate } from 'node:crypto'

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
	keepAlive: Typesafe.boolean,
	keepAliveInitialDelayMs: Typesafe.number,
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

const positiveInteger: Typesafe.Type<number> = (input, path = []) => {
	const value = Typesafe.integer(input, path)
	return value > 0 ? value : Typesafe.fail(path, 'must be a positive integer')
}

export const telemetryConfigSchema = Typesafe.partial({
	resource: Typesafe.partial({
		serviceName: Typesafe.string,
		attributes: Typesafe.record(Typesafe.string, Typesafe.string),
	}),
	traces: Typesafe.partial({
		enabled: Typesafe.boolean,
		exporter: Typesafe.partial({
			type: Typesafe.enumeration('otlp-http', 'console'),
			endpoint: Typesafe.string,
			headers: Typesafe.record(Typesafe.string, Typesafe.string),
			timeoutMs: Typesafe.number,
		}),
		sampler: Typesafe.enumeration('always', 'never', 'ratio', 'parentRatio'),
		samplerRatio: Typesafe.number,
		// Whether a client-supplied traceparent may become the parent of the request span.
		acceptIncoming: Typesafe.enumeration('none', 'trusted-proxies', 'all'),
		// Whether outgoing Actions webhooks carry a traceparent header. Enabled when absent.
		propagateToWebhooks: Typesafe.boolean,
		traceIdResponseHeader: Typesafe.boolean,
		maxSpansPerRequest: Typesafe.number,
		sql: Typesafe.partial({
			enabled: Typesafe.boolean,
			includeQueryText: Typesafe.boolean,
			minDurationMs: Typesafe.number,
		}),
		batch: Typesafe.partial({
			maxQueueSize: positiveInteger,
			maxBatchSize: positiveInteger,
			delayMs: positiveInteger,
		}),
	}),
})

/** A JSON array, or a comma-separated string from an environment variable. */
const readStringList = (val: unknown, path: PropertyKey[]): string[] => {
	if (!Array.isArray(val) && typeof val !== 'string') {
		return Typesafe.fail(path, 'must be an array or a comma-separated string')
	}
	return (Array.isArray(val) ? val : val.split(','))
		.map((it, index) => Typesafe.string(it, [...path, index]).trim())
		.filter(it => it.length > 0)
}

const hostnamePattern = /^(?=.{1,253}$)[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/

const isIpLiteral = (value: string): boolean => ipaddr.IPv4.isValidFourPartDecimal(value) || ipaddr.IPv6.isValid(value)

const parseHost = (entry: string, path: PropertyKey[]): string => {
	const host = entry.toLowerCase()
	return hostnamePattern.test(host) || isIpLiteral(host) ? host : Typesafe.fail([...path, entry], 'must be a hostname or an IP address')
}

const durationUnits: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 }

/** Seconds, or a string like `90s`, `30m`, `6h`, `1d` (a bare number is seconds). */
const durationSeconds = (val: unknown, path: PropertyKey[] = []): number => {
	if (typeof val === 'number' && Number.isInteger(val) && val >= 0) {
		return val
	}
	const match = typeof val === 'string' ? val.trim().match(/^(\d+)([smhd]?)$/) : null
	if (match === null) {
		return Typesafe.fail(path, 'must be a duration like 6h, 30m, 90s or 1d')
	}
	return Number(match[1]) * (match[2] === '' ? 1 : durationUnits[match[2]])
}

/** A path to a PEM bundle; read and split at startup so a broken bundle fails the boot, not the first issuer fetch. */
const pemCertificateBundle = (val: unknown, path: PropertyKey[] = []): string[] => {
	const file = Typesafe.string(val, path)
	let content: string
	try {
		content = readFileSync(file, 'utf8')
	} catch (e) {
		return Typesafe.fail(path, `cannot read ${file}: ${e instanceof Error ? e.message : String(e)}`)
	}
	const certificates = content.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) ?? []
	if (certificates.length === 0) {
		return Typesafe.fail(path, `${file} contains no PEM certificate`)
	}
	for (const [index, certificate] of certificates.entries()) {
		try {
			new X509Certificate(certificate)
		} catch {
			return Typesafe.fail(path, `certificate #${index + 1} in ${file} is invalid`)
		}
	}
	return certificates
}

/** §16: instance-level relaxations of the workload identity issuer fetch policy — never tenant config. */
export const workloadIdentityConfigSchema = Typesafe.partial({
	// Hostnames or CIDRs exempt from the private-range ban; a bare IP becomes a single-address CIDR.
	egressAllowlist: (val: unknown, path: PropertyKey[] = []): string[] | undefined => {
		const entries = readStringList(val, path).map(entry => {
			if (entry.includes('/')) {
				return ipaddr.IPv4.isValidCIDRFourPartDecimal(entry) || ipaddr.IPv6.isValidCIDR(entry)
					? entry
					: Typesafe.fail([...path, entry], 'must be a CIDR, an IP address or a hostname')
			}
			if (isIpLiteral(entry)) {
				return `${entry}/${ipaddr.IPv6.isValid(entry) ? 128 : 32}`
			}
			return parseHost(entry, path)
		})
		return entries.length > 0 ? entries : undefined
	},
	// Issuer and JWKS hosts allowed over plain http, loopback included — development only.
	insecureIssuers: (val: unknown, path: PropertyKey[] = []): string[] | undefined => {
		const hosts = readStringList(val, path).map(entry => parseHost(entry, path))
		return hosts.length > 0 ? hosts : undefined
	},
	caCertificates: (val: unknown, path: PropertyKey[] = []): string[] | undefined => val === '' ? undefined : pemCertificateBundle(val, path),
	// Parsed to seconds.
	jwksMaxStaleness: (val: unknown, path: PropertyKey[] = []): number | undefined => val === '' ? undefined : durationSeconds(val, path),
})

export const serverConfigSchema = Typesafe.partial({
	port: Typesafe.number,
	http: Typesafe.partial({
		// Both thresholds come from separate environment variables, so an empty object means "disabled".
		requestMemoryBudget: (input: unknown, path: PropertyKey[] = []): { warnBytes: number; maxBytes: number } | undefined => {
			const { warnBytes, maxBytes } = Typesafe.partial({ warnBytes: Typesafe.integer, maxBytes: Typesafe.integer })(input, path)
			if (warnBytes === undefined && maxBytes === undefined) {
				return undefined
			}
			if (warnBytes === undefined || maxBytes === undefined) {
				return Typesafe.fail(path, 'warnBytes and maxBytes must be set together')
			}
			const optionsError = validateRequestMemoryBudgetOptions({ warnBytes, maxBytes })
			return optionsError ? Typesafe.fail(path, optionsError) : { warnBytes, maxBytes }
		},
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
		schemaCacheMaxEntries: (input: unknown, path: PropertyKey[] = []): number | undefined => {
			if (input === undefined) {
				return undefined
			}
			const maxEntries = Typesafe.integer(input, path)
			return maxEntries > 0 ? maxEntries : Typesafe.fail(path, 'must be a positive integer')
		},
		forcePrimaryHeader: Typesafe.boolean,
		whereOptimizer: Typesafe.partial({
			disable: Typesafe.boolean,
			maxCrossOptimizationInput: Typesafe.number,
		}),
	}),
	logging: Typesafe.union(
		(val): { sentry?: { dsn: string } } => Typesafe.valueAt(val, ['sentry', 'dsn']) === undefined ? {} : Typesafe.fail([]),
		Typesafe.partial({
			sentry: Typesafe.object({
				dsn: Typesafe.string,
			}),
		}),
	),
	telemetry: telemetryConfigSchema,
	workloadIdentity: workloadIdentityConfigSchema,
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
	// Management panel served by the engine (@contember/engine-panel). Off by default: the API port is
	// often public, so a login page appears only when an operator asks for it. `path` is the mount
	// point, e.g. "/panel"; the panel's API lives directly under it.
	panel: Typesafe.partial({
		enabled: Typesafe.boolean,
		path: Typesafe.string,
	}),
	monitoringPort: Typesafe.number,
	workerCount: Typesafe.union(Typesafe.number, Typesafe.string),
	applicationWorker: Typesafe.string,
	// How long the engine keeps serving after SIGTERM before it shuts down; unset means at once.
	shutdownDelayMs: Typesafe.number,
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
