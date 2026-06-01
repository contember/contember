import { expect, test } from 'bun:test'
import { InvalidSchemaError, MigrationError, ProjectMigrator } from '../../../src/model/index.js'
import { SchemaStateInput } from '../../../src/model/migrations/MigrationInput.js'
import { emptySchema } from '@contember/schema-utils'

// The state-only path never touches the database (no migrations to apply, no schema row to save on a
// fresh project), so the collaborators that would hit the DB can be stubbed.
const buildMigrator = () =>
	new ProjectMigrator(
		{} as any, // migrationDescriber — unused without schema migrations
		{ fetch: async () => ({ schema: emptySchema, meta: {} }) } as any, // SchemaProvider: fresh project, no schema row
		{ getMigrations: async () => [] } as any, // ExecutedMigrationsResolver: nothing executed
		{ create: () => ({ getMetadata: async () => ({}), invalidate: () => {} }) } as any,
		{} as any, // contentQueryExecutor — unused
	)

const migrate = (schemaState: SchemaStateInput) =>
	buildMigrator().migrate({
		db: {} as any,
		project: { slug: 'test', systemSchema: 'system' },
		identity: { id: '00000000-0000-0000-0000-000000000000' },
		stages: [],
		migrationsToExecute: [],
		schemaState,
		options: {},
	})

const stateWith = (acl: unknown): SchemaStateInput => ({
	acl,
	validation: emptySchema.validation,
	actions: emptySchema.actions,
	settings: emptySchema.settings,
})

test('state-only migrate on a fresh project (no migrations) is a clean no-op, not a crash', async () => {
	// Regression: previously the `!id` guard threw ImplementationException before the intended
	// fresh-project early return — and ImplementationException is not a MigrationError, so it leaked.
	const validAcl = { roles: { admin: { variables: {}, stages: '*', entities: {} } } }
	await expect(migrate(stateWith(validAcl))).resolves.toBeUndefined()
})

test('invalid overlaid schema state is rejected as a MigrationError (clean INVALID_SCHEMA)', async () => {
	// acl referencing an entity that does not exist in the model
	const invalidAcl = { roles: { admin: { variables: {}, stages: '*', entities: { Unknown: { predicates: {}, operations: {} } } } } }
	const err = await migrate(stateWith(invalidAcl)).then(() => null, e => e)
	expect(err).toBeInstanceOf(InvalidSchemaError)
	expect(err).toBeInstanceOf(MigrationError)
})
