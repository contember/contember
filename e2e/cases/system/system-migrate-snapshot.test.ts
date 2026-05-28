import { expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { emptySchema } from '@contember/schema-utils'
import { ModificationHandlerFactory, SchemaDiffer, SchemaMigrator, VERSION_LATEST } from '@contember/schema-migrations'

namespace AuthorModel {
	export class Author {
		name = def.stringColumn()
	}
}

namespace AuthorCategoryModel {
	export class Author {
		name = def.stringColumn()
	}

	export class Category {
		title = def.stringColumn()
	}
}

const differ = new SchemaDiffer(new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)))

const SNAPSHOT_MUTATION = gql`mutation($snapshot: SnapshotInput!, $schemaState: SchemaStateInput) {
	migrateFromSnapshot(snapshot: $snapshot, schemaState: $schemaState) {
		ok
		error { code }
	}
}`

type Tester = Awaited<ReturnType<typeof createTester>>

const systemData = async (tester: Tester, query: string) => (await tester(query, { path: `/system/${tester.projectSlug}` })).body.data

const schemaCover = (version: string, modifications: unknown[]) => ({
	version,
	name: `${version}-m`,
	type: 'SCHEMA',
	schemaMigration: { formatVersion: VERSION_LATEST, modifications },
})

test('System API: migrateFromSnapshot bootstraps an empty project', async () => {
	// createTester(emptySchema) leaves the project with zero executed migrations
	const tester = await createTester(emptySchema)
	const schema = createSchema(AuthorModel)
	const collapsed = differ.diffSchemas(emptySchema, schema)
	const version = '2024-07-01-120000'

	await tester(SNAPSHOT_MUTATION, {
		path: `/system/${tester.projectSlug}`,
		variables: {
			snapshot: { formatVersion: VERSION_LATEST, modifications: collapsed, covers: [schemaCover(version, collapsed)] },
			schemaState: null,
		},
	})
		.expect(response => {
			expect(response.body.data).toStrictEqual({ migrateFromSnapshot: { ok: true, error: null } })
		})
		.expect(200)

	// the covered migration is recorded as executed without having been replayed
	expect((await systemData(tester, gql`query { executedMigrations { version name } }`)).executedMigrations)
		.toStrictEqual([{ version, name: `${version}-m` }])

	// the collapsed schema is live: the content API exposes the entity
	await tester(gql`query { listAuthor { id } }`).expect(200)
})

test('System API: migrateFromSnapshot is refused on a non-empty project', async () => {
	const schema = createSchema(AuthorModel)
	const tester = await createTester(schema) // already has an executed migration
	const collapsed = differ.diffSchemas(emptySchema, schema)

	await tester(SNAPSHOT_MUTATION, {
		path: `/system/${tester.projectSlug}`,
		variables: {
			snapshot: { formatVersion: VERSION_LATEST, modifications: collapsed, covers: [schemaCover('2024-07-01-120000', collapsed)] },
			schemaState: null,
		},
	})
		.expect(response => {
			expect(response.body.data.migrateFromSnapshot.ok).toBe(false)
			expect(response.body.data.migrateFromSnapshot.error.code).toBe('PROJECT_NOT_EMPTY')
		})
		.expect(200)
})

test('System API: a snapshot-bootstrapped project equals a full replay (schema + registry)', async () => {
	const schemaA = createSchema(AuthorModel)
	const schemaAB = createSchema(AuthorCategoryModel)
	const m1 = differ.diffSchemas(emptySchema, schemaA)
	const m2 = differ.diffSchemas(schemaA, schemaAB)
	const v1 = '2024-07-01-120000'
	const v2 = '2024-07-02-120000'

	// full replay: run both migrations one by one
	const full = await createTester(emptySchema)
	await full.migrate(m1, `${v1}-m`)
	await full.migrate(m2, `${v2}-m`)

	// snapshot bootstrap: apply the collapsed schema once, record both migrations as covered
	const snap = await createTester(emptySchema)
	const collapsed = differ.diffSchemas(emptySchema, schemaAB)
	await snap(SNAPSHOT_MUTATION, {
		path: `/system/${snap.projectSlug}`,
		variables: {
			snapshot: { formatVersion: VERSION_LATEST, modifications: collapsed, covers: [schemaCover(v1, m1), schemaCover(v2, m2)] },
			schemaState: null,
		},
	})
		.expect(response => expect(response.body.data).toStrictEqual({ migrateFromSnapshot: { ok: true, error: null } }))
		.expect(200)

	// identical resulting schema
	const fullSchema = (await systemData(full, gql`query { schema }`)).schema
	const snapSchema = (await systemData(snap, gql`query { schema }`)).schema
	expect(snapSchema).toStrictEqual(fullSchema)

	// identical executed-migration registry (versions + checksums)
	const reg = gql`query { executedMigrations { version checksum } }`
	const fullReg = (await systemData(full, reg)).executedMigrations
	const snapReg = (await systemData(snap, reg)).executedMigrations
	expect(snapReg).toStrictEqual(fullReg)
})

test('System API: a content migration is recorded as covered, and later migrations run on top', async () => {
	const schemaA = createSchema(AuthorModel)
	const schemaAB = createSchema(AuthorCategoryModel)
	const collapsed = differ.diffSchemas(emptySchema, schemaA)
	const afterModifications = differ.diffSchemas(schemaA, schemaAB)
	const v1 = '2024-07-01-120000'
	const v2content = '2024-07-02-120000'
	const v3 = '2024-07-03-120000'

	const tester = await createTester(emptySchema)
	await tester(SNAPSHOT_MUTATION, {
		path: `/system/${tester.projectSlug}`,
		variables: {
			snapshot: {
				formatVersion: VERSION_LATEST,
				modifications: collapsed,
				covers: [
					schemaCover(v1, collapsed),
					{ version: v2content, name: `${v2content}-seed`, type: 'CONTENT', contentMigration: [] },
				],
			},
			schemaState: null,
		},
	})
		.expect(response => expect(response.body.data).toStrictEqual({ migrateFromSnapshot: { ok: true, error: null } }))
		.expect(200)

	// the covered content migration is in the registry
	expect((await systemData(tester, gql`query { executedMigrations { version } }`)).executedMigrations)
		.toStrictEqual([{ version: v1 }, { version: v2content }])

	// a migration created after the snapshot runs normally (no MUST_FOLLOW_LATEST)
	await tester.migrate(afterModifications, `${v3}-m`)
	expect((await systemData(tester, gql`query { executedMigrations { version } }`)).executedMigrations)
		.toStrictEqual([{ version: v1 }, { version: v2content }, { version: v3 }])
	await tester(gql`query { listCategory { id } }`).expect(200)
})

test('System API: migrateFromSnapshot overlays schemaState (state mode)', async () => {
	const base = createSchema(AuthorModel)
	const schemaState = {
		acl: { roles: { admin: { variables: {}, stages: '*', entities: {} } } },
		validation: base.validation,
		actions: base.actions,
		settings: base.settings,
	}
	// state mode: the collapsed schema is model-only, ACL comes from schemaState
	const collapsed = differ.diffSchemas(emptySchema, base, { skipNonModelDiffers: true })
	const version = '2024-07-01-120000'

	const tester = await createTester(emptySchema)
	await tester(SNAPSHOT_MUTATION, {
		path: `/system/${tester.projectSlug}`,
		variables: {
			snapshot: { formatVersion: VERSION_LATEST, modifications: collapsed, covers: [schemaCover(version, collapsed)] },
			schemaState,
		},
	})
		.expect(response => expect(response.body.data).toStrictEqual({ migrateFromSnapshot: { ok: true, error: null } }))
		.expect(200)

	const schema = (await systemData(tester, gql`query { schema }`)).schema
	expect(schema.acl.roles.admin).toBeDefined()
})
