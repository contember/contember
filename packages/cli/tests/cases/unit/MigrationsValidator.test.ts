import { beforeAll, expect, test } from 'bun:test'
import chalk from 'chalk'
import { emptySchema } from '@contember/schema-utils'
import { MigrationDescriber, ModificationHandlerFactory, SchemaMigrator, VERSION_LATEST } from '@contember/schema-migrations'
import { Migration } from '@contember/migrations-client'
import { MigrationsValidator } from '../../../src/lib/migrations/MigrationsValidator.js'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'

beforeAll(() => {
	// deterministic assertions regardless of the terminal the suite runs in
	chalk.level = 0
})

// A migration that grants a role on an entity the model does not have — applying it succeeds, but the
// resulting schema fails validation (ACL_UNDEFINED_ENTITY).
const invalidAclMigration: Migration = {
	version: '2024-01-01-120000',
	name: '2024-01-01-120000-invalid-acl',
	formatVersion: VERSION_LATEST,
	modifications: [
		{
			modification: 'updateAclSchema',
			schema: {
				roles: {
					admin: {
						variables: {},
						stages: '*',
						entities: { Ghost: { predicates: {}, operations: { read: { id: true } } } },
					},
				},
			},
		},
	],
}

const buildValidator = (options: { quiet?: boolean } = {}) => {
	const factory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
	const { output, stdout, stderr } = createTestOutput()
	if (options.quiet) {
		output.setMode('quiet')
	}
	return { validator: new MigrationsValidator(new MigrationDescriber(factory), new SchemaMigrator(factory), output), stdout, stderr }
}

test('reports validation errors of a migrated schema on stderr', () => {
	const { validator, stdout, stderr } = buildValidator()

	expect(validator.validate(emptySchema, [invalidAclMigration])).toBe(false)
	expect(stderr.text).toContain('2024-01-01-120000-invalid-acl produces invalid schema')
	expect(stderr.text).toContain('ACL_UNDEFINED_ENTITY')
	// diagnostics never leak into the data stream
	expect(stdout.text).toBe('')
})

test('prints nothing in quiet mode, while still reporting the schema as invalid', () => {
	const { validator, stdout, stderr } = buildValidator({ quiet: true })

	expect(validator.validate(emptySchema, [invalidAclMigration])).toBe(false)
	expect(stderr.text).toBe('')
	expect(stdout.text).toBe('')
})
