import { describe, expect, test } from 'bun:test'
import { EntityTypeSchemaGenerator } from '../src/index.js'
import { schemas } from './schemas.js'

describe('generate entities', () => {
	const entityGenerator = new EntityTypeSchemaGenerator()
	test('generate for scalars', () => {
		expect(entityGenerator.generate(schemas.scalarsSchema.model)).toMatchSnapshot()
	})

	test('generate for scalars excluding deprecated', () => {
		expect(entityGenerator.generate(schemas.scalarsSchema.model, { excludeDeprecated: true })).toMatchSnapshot()
	})

	test('generate for has enum', () => {
		expect(entityGenerator.generate(schemas.enumSchema.model)).toMatchSnapshot()
	})

	test('generate for has enum excluding deprecated', () => {
		expect(entityGenerator.generate(schemas.enumSchema.model, { excludeDeprecated: true })).toMatchSnapshot()
	})

	test('generate one has one', () => {
		expect(entityGenerator.generate(schemas.oneHasOneSchema.model)).toMatchSnapshot()
	})

	test('generate one has one excluding deprecated', () => {
		expect(entityGenerator.generate(schemas.oneHasOneSchema.model, { excludeDeprecated: true })).toMatchSnapshot()
	})

	test('generate one has many', () => {
		expect(entityGenerator.generate(schemas.oneHasManySchema.model)).toMatchSnapshot()
	})

	test('generate one has many excluding deprecated', () => {
		expect(entityGenerator.generate(schemas.oneHasManySchema.model, { excludeDeprecated: true })).toMatchSnapshot()
	})

	test('generate many has many', () => {
		expect(entityGenerator.generate(schemas.manyHasManySchema.model)).toMatchSnapshot()
	})

	test('generate many has many excluding deprecated', () => {
		expect(entityGenerator.generate(schemas.manyHasManySchema.model, { excludeDeprecated: true })).toMatchSnapshot()
	})

	test('generate reduced has by', () => {
		expect(entityGenerator.generate(schemas.reducedHasManySchema.model)).toMatchSnapshot()
	})

	test('json column without schema stays JSONValue, with schema is derived', () => {
		const output = entityGenerator.generate(schemas.jsonSchemaSchema.model)
		// schema-less json column keeps JSONValue
		expect(output).toContain('plain: JSONValue | null')
		// json column with a schema gets the derived object type
		expect(output).toContain('structured: { name: string; age?: number; tags?: readonly (string)[] } | null')
	})

	test('generate reduced has by excluding deprecated', () => {
		expect(entityGenerator.generate(schemas.reducedHasManySchema.model, { excludeDeprecated: true })).toMatchSnapshot()
	})

	test('non-deprecated relation to a deprecated entity is dropped when excluding deprecated', () => {
		const output = entityGenerator.generate(schemas.danglingDeprecatedRefSchema.model, { excludeDeprecated: true })
		// the deprecated entity itself is excluded
		expect(output).not.toContain('DeprecatedTarget')
		// and the relation pointing to it must be dropped, otherwise the generated code references a missing type
		expect(output).not.toContain('target:')
	})

	test('deprecated entities and fields are kept and marked by default', () => {
		const output = entityGenerator.generate(schemas.danglingDeprecatedRefSchema.model)
		expect(output).toContain('export type DeprecatedTarget')
		expect(output).toContain('target: DeprecatedTarget')
		expect(output).toContain('@deprecated')
	})
})
