import { ClientErrorCodes, Connection, DatabaseError } from '@contember/database'
import { Logger } from '@contember/logger'
import { ProjectConfig } from '../../project/config.js'
import { databaseErrorAttributes } from './errorLogging.js'

export type ReadAfterWriteState =
	| { enabled: false }
	| { enabled: true; clusterId: string }

/** The oldest release the engine is tested against, and new enough for the xid8 functions we need. */
const minServerVersion = 140000

const clusterQuery = `SELECT current_setting('server_version_num')::int AS version, system_identifier::text AS cluster_id FROM pg_control_system()`

const disabled: ReadAfterWriteState = { enabled: false }

/** SQLSTATEs of a check that cannot succeed on this database, however many times it is repeated. */
const permanentErrorCodes: ReadonlySet<string> = new Set<string>([
	ClientErrorCodes.INSUFFICIENT_PRIVILEGE,
	ClientErrorCodes.UNDEFINED_FUNCTION,
	ClientErrorCodes.FEATURE_NOT_SUPPORTED,
	ClientErrorCodes.SYNTAX_ERROR,
])

const isPermanentError = (error: unknown): boolean =>
	error instanceof DatabaseError && error.code !== undefined && permanentErrorCodes.has(error.code)

type ClusterInfo = { version: number; clusterId: string }

/**
 * Decides once per project whether read-after-write routing can be offered, and caches the answer.
 * Both databases are inspected on the first request that could use the feature.
 */
export class ReadAfterWriteResolver {
	private state: Promise<ReadAfterWriteState> | undefined

	constructor(
		private readonly project: ProjectConfig,
		private readonly connection: Connection.ConnectionType,
		private readonly readConnection: Connection.ConnectionType,
		private readonly logger: Logger,
	) {
	}

	public resolve(): Promise<ReadAfterWriteState> {
		if (this.state !== undefined) {
			return this.state
		}
		const pending: Promise<ReadAfterWriteState> = this.check().catch(e => {
			if (isPermanentError(e)) {
				// a revoked privilege or a missing function does not heal itself; keep the cached "no",
				// otherwise every request would repeat the check and log this again
				this.logger.error(
					`Read-after-write disabled for project ${this.project.slug}: the database cluster check cannot succeed here`,
					databaseErrorAttributes(e),
				)
				return disabled
			}
			// a connection error says nothing about the configuration - keep the feature undecided
			if (this.state === pending) {
				this.state = undefined
			}
			this.logger.warn('Read-after-write: the database cluster check failed, retrying on the next request', databaseErrorAttributes(e))
			return disabled
		})
		this.state = pending
		return pending
	}

	private async check(): Promise<ReadAfterWriteState> {
		const read = this.project.db.read
		if (read === undefined || this.readConnection === this.connection) {
			return disabled
		}
		if (read.readAfterWrite?.enabled === false) {
			return disabled
		}
		const [primary, replica] = await Promise.all([
			this.queryCluster(this.connection),
			this.queryCluster(this.readConnection),
		])
		if (primary === null || replica === null) {
			// an answerless pg_control_system() is a property of the server, not a transient failure
			const side = primary === null ? 'primary' : 'read replica'
			this.logger.error(`Read-after-write disabled for project ${this.project.slug}: pg_control_system() returned no row on the ${side}`)
			return disabled
		}
		const problem = describeProblem(primary, replica)
		if (problem !== null) {
			this.logger.error(`Read-after-write disabled for project ${this.project.slug}: ${problem}`)
			return disabled
		}
		return { enabled: true, clusterId: primary.clusterId }
	}

	private async queryCluster(connection: Connection.ConnectionType): Promise<ClusterInfo | null> {
		const result = await connection.query<{ version: number; cluster_id: string }>(clusterQuery)
		const row = result.rows[0]
		return row === undefined ? null : { version: row.version, clusterId: row.cluster_id }
	}
}

const describeProblem = (primary: ClusterInfo, replica: ClusterInfo): string | null => {
	const tooOld = (side: string, info: ClusterInfo): string | null =>
		info.version < minServerVersion
			? `PostgreSQL 14 or newer is required, the ${side} reports server_version_num ${info.version}`
			: null
	const mismatch = primary.clusterId !== replica.clusterId
		? `the read replica is not a physical replica of the primary`
			+ ` (system_identifier ${replica.clusterId} vs ${primary.clusterId} on the primary)`
		: null
	return tooOld('primary', primary) ?? tooOld('read replica', replica) ?? mismatch
}
