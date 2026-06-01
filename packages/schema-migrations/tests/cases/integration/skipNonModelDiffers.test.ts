import { describe, expect, test } from 'bun:test'
import { ModificationHandlerFactory, SchemaDiffer, SchemaMigrator } from '../../../src/index.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model, Schema } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'

const schemaDiffer = new SchemaDiffer(
	new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)),
)

// Modifications produced by the non-model differs (acl/validation/actions/settings).
// In schema state mode these are skipped because those parts live in state/*.json instead of migrations.
const nonModelModifications = [
	'patchAclSchema',
	'updateAclSchema',
	'patchValidationSchema',
	'updateValidationSchema',
	'updateSettings',
	'createTrigger',
	'updateTrigger',
	'removeTrigger',
	'createTarget',
	'updateTarget',
	'removeTarget',
]

const model = (extraColumn = false) =>
	new SchemaBuilder()
		.entity('Article', entity => {
			let built = entity.column('title', c => c.type(Model.ColumnType.String))
			if (extraColumn) {
				built = built.column('slug', c => c.type(Model.ColumnType.String))
			}
			return built
		})
		.buildSchema()

const acl: Acl.Schema = {
	roles: {
		admin: {
			variables: {},
			stages: '*',
			entities: {
				Article: {
					predicates: {},
					operations: { read: { id: true, title: true } },
				},
			},
		},
	},
}

const withSchema = (partial: Partial<Schema>): Schema => ({ ...emptySchema, ...partial })

describe('skipNonModelDiffers', () => {
	test('produces empty diff when only non-model parts (acl + settings) change', () => {
		const original = withSchema({ model: model() })
		const updated = withSchema({
			model: model(),
			acl,
			settings: { content: { useExistsInHasManyFilter: true } },
		})

		const diff = schemaDiffer.diffSchemas(original, updated, { skipNonModelDiffers: true })

		expect(diff).toStrictEqual([])
	})

	test('emits only model modifications when both model and acl change', () => {
		const original = withSchema({ model: model() })
		const updated = withSchema({ model: model(true), acl })

		const diff = schemaDiffer.diffSchemas(original, updated, { skipNonModelDiffers: true })

		expect(diff.length).toBeGreaterThan(0)
		for (const modification of diff) {
			expect(nonModelModifications).not.toContain(modification.modification)
		}
	})

	test('default behavior (without skip) still emits the acl modification', () => {
		const original = withSchema({ model: model() })
		const updated = withSchema({ model: model(), acl })

		const diff = schemaDiffer.diffSchemas(original, updated, { skipInitialSchemaValidation: true })

		expect(diff.map(it => it.modification)).toContain('patchAclSchema')
	})

	test('recreate validation passes for model+acl change with skip (non-model parts are neutralized)', () => {
		const original = withSchema({ model: model() })
		const updated = withSchema({ model: model(true), acl })

		// skipRecreateValidation defaults to false here, so this exercises the targetForCompare neutralization path.
		expect(() => schemaDiffer.diffSchemas(original, updated, { skipNonModelDiffers: true })).not.toThrow()
	})
})
