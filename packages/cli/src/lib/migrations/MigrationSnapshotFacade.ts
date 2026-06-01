import { compareArraysIgnoreOrder, deepCompare, emptySchema } from '@contember/schema-utils'
import {
	calculateMigrationChecksum,
	CoveredMigration,
	ExecutedMigrationInfo,
	isSchemaMigration,
	MigrationContent,
	MigrationsResolver,
	SchemaDiffer,
	SchemaMigrator,
	SchemaStateManager,
	SchemaVersionBuilder,
	SnapshotFile,
	SnapshotInput,
	SnapshotManager,
	VERSION_LATEST,
} from '@contember/migrations-client'

export class MigrationSnapshotFacade {
	constructor(
		private readonly migrationsResolver: MigrationsResolver,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly schemaDiffer: SchemaDiffer,
		private readonly schemaMigrator: SchemaMigrator,
		private readonly schemaStateManager: SchemaStateManager,
		private readonly snapshotManager: SnapshotManager,
	) {
	}

	/** Collapses all migrations into a single schema snapshot and writes snapshot.json. */
	async create(): Promise<SnapshotFile> {
		const files = await this.migrationsResolver.getMigrationFiles()
		if (files.length === 0) {
			throw 'No migrations to snapshot'
		}
		const stateMode = await this.schemaStateManager.isStateMode()
		const version = files[files.length - 1].version

		// Replay all schema migrations into a single schema. In state mode the non-model parts
		// (acl/validation/actions/settings) live in state/ and are skipped here; otherwise they
		// are part of the migration history and must be included in the collapsed modifications.
		const collapsedSchema = await this.schemaVersionBuilder.buildSchemaAdvanced(emptySchema, () => true)
		const modifications = this.schemaDiffer.diffSchemas(emptySchema, collapsedSchema, {
			skipNonModelDiffers: stateMode,
		})

		const covers: CoveredMigration[] = []
		const contentMigrations: string[] = []
		for (const file of files) {
			const content = await file.getContent()
			const schema = isSchemaMigration(content)
			covers.push({
				version: file.version,
				name: file.name,
				type: schema ? 'schema' : 'content',
				checksum: schema ? calculateMigrationChecksum(content) : null,
			})
			if (!schema) {
				contentMigrations.push(file.version)
			}
		}

		const snapshot: SnapshotFile = {
			version,
			stateMode,
			snapshot: { formatVersion: VERSION_LATEST, modifications },
			covers,
			contentMigrations,
		}
		await this.snapshotManager.write(snapshot)
		return snapshot
	}

	/**
	 * Returns the snapshot when it can safely bootstrap the current project, else null.
	 * The snapshot is only usable on an empty project (no executed migrations) and only when
	 * none of the covered migration files have changed. A present-but-stale snapshot is skipped
	 * with a warning, falling back to a full replay.
	 */
	async getUsableSnapshot(executedMigrations: ExecutedMigrationInfo[]): Promise<SnapshotFile | null> {
		if (!(await this.snapshotManager.exists())) {
			return null
		}
		if (executedMigrations.length > 0) {
			return null
		}
		const snapshot = await this.snapshotManager.read()
		const stale = await this.findStaleness(snapshot)
		if (stale) {
			console.warn(`Ignoring snapshot: ${stale}. Run "migrations:snapshot" to regenerate it.`)
			return null
		}
		return snapshot
	}

	/** Maps a snapshot to the GraphQL SnapshotInput; covered migrations are sent as Migration inputs. */
	async buildSnapshotInput(snapshot: SnapshotFile): Promise<SnapshotInput> {
		const files = await this.migrationsResolver.getMigrationFiles()
		const byVersion = new Map(files.map(it => [it.version, it]))
		const covers: unknown[] = []
		for (const covered of snapshot.covers) {
			const file = byVersion.get(covered.version)
			if (!file) {
				throw `Snapshot covers missing migration ${covered.name}`
			}
			covers.push(migrationContentToInput(covered.version, covered.name, await file.getContent()))
		}
		return {
			formatVersion: snapshot.snapshot.formatVersion,
			modifications: snapshot.snapshot.modifications,
			covers,
		}
	}

	/** Offline check that the snapshot still equals a full replay of all migrations. */
	async verify(): Promise<{ ok: boolean; message: string }> {
		if (!(await this.snapshotManager.exists())) {
			throw 'No snapshot found. Run "migrations:snapshot" first.'
		}
		const snapshot = await this.snapshotManager.read()

		const stale = await this.findStaleness(snapshot)
		if (stale) {
			return { ok: false, message: `Snapshot is stale: ${stale}. Run "migrations:snapshot" to regenerate it.` }
		}

		const stateMode = await this.schemaStateManager.isStateMode()
		const replaySchema = await this.schemaVersionBuilder.buildSchema()
		let snapshotSchema = this.schemaMigrator.applyModifications(emptySchema, snapshot.snapshot.modifications, snapshot.snapshot.formatVersion)
		if (stateMode) {
			snapshotSchema = { ...snapshotSchema, ...await this.schemaStateManager.readState() }
		}

		// Compare with the same order-insensitive equality that SchemaDiffer uses for its own
		// round-trip check. The collapsed differ emits fields/constraints in a fixed order that may
		// differ from a replay of an interleaved history (e.g. a column added to an entity that
		// already has a relation), so a raw checksum (JSON.stringify) would report false mismatches
		// on schemas that are in fact deeply equal.
		const differences = deepCompare(replaySchema, snapshotSchema, [], path => {
			if (path[0] === 'model' && path[1] === 'entities' && (path[3] === 'unique' || path[3] === 'index')) {
				return (a, b) => compareArraysIgnoreOrder(a, b, path)
			}
			return null
		})
		if (differences.length === 0) {
			return {
				ok: true,
				message: `Snapshot is up to date (covers ${snapshot.covers.length} migrations up to ${snapshot.version}).`,
			}
		}
		return {
			ok: false,
			message: 'Snapshot does not match a full replay of all migrations. Run "migrations:snapshot" to regenerate it.',
		}
	}

	private async findStaleness(snapshot: SnapshotFile): Promise<string | null> {
		// The collapsed snapshot is built differently per mode (state mode omits the non-model parts,
		// see create()), and on bootstrap the non-model overlay is driven by the *current* mode. A mode
		// switch since the snapshot was created (e.g. migrations:init-state) leaves the covers untouched
		// and would otherwise pass unnoticed, so treat it as stale and fall back to a full replay.
		if (snapshot.stateMode !== await this.schemaStateManager.isStateMode()) {
			return `schema state mode changed since the snapshot was created`
		}
		const files = await this.migrationsResolver.getMigrationFiles()
		const byVersion = new Map(files.map(it => [it.version, it]))
		for (const covered of snapshot.covers) {
			const file = byVersion.get(covered.version)
			if (!file) {
				return `covered migration ${covered.name} is missing`
			}
			const content = await file.getContent()
			const currentType = isSchemaMigration(content) ? 'schema' : 'content'
			// A covered migration that flipped type (e.g. a content migration manually rewritten into a
			// schema one) is not reflected in the collapsed modifications, so the snapshot no longer
			// equals a replay. Schema covers also verify the checksum; content covers carry none (their
			// data is never reproduced), so the type check is the only identity they get.
			if (currentType !== covered.type) {
				return `covered migration ${covered.name} changed type`
			}
			if (covered.type === 'schema') {
				const checksum = isSchemaMigration(content) ? calculateMigrationChecksum(content) : null
				if (checksum !== covered.checksum) {
					return `covered migration ${covered.name} has changed`
				}
			}
		}
		// Detect a migration added within the covered range (version <= snapshot.version) that the
		// snapshot does not know about — e.g. a teammate's migration with an earlier timestamp merged
		// after the snapshot was generated. Without this, bootstrapping would record the covers up to
		// snapshot.version and the subsequent normal replay would fail with MUST_FOLLOW_LATEST on the
		// in-range migration, leaving the database half-bootstrapped. Treat it as stale and fall back.
		const coveredVersions = new Set(snapshot.covers.map(it => it.version))
		for (const file of files) {
			if (file.version <= snapshot.version && !coveredVersions.has(file.version)) {
				return `migration ${file.name} is within the covered range but not part of the snapshot`
			}
		}
		return null
	}
}

const migrationContentToInput = (version: string, name: string, content: MigrationContent) => {
	if (isSchemaMigration(content)) {
		return {
			version,
			name,
			type: 'SCHEMA',
			schemaMigration: {
				formatVersion: content.formatVersion,
				modifications: content.modifications,
				skippedErrors: content.skippedErrors,
			},
		}
	}
	// Content migrations are only recorded as executed (no data is replayed), so the queries are irrelevant.
	return { version, name, type: 'CONTENT', contentMigration: [] }
}
