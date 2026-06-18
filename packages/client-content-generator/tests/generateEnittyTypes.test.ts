import { describe, expect, test } from 'bun:test'
import { EntityTypeSchemaGenerator } from '../src/index.js'
import { schemas } from './schemas.js'

describe('generate entities', () => {
	const entityGenerator = new EntityTypeSchemaGenerator()
	test('generate for scalars', () => {
		expect(entityGenerator.generate(schemas.scalarsSchema.model)).toMatchSnapshot()
	})

	test('generate for scalars with deprecated', () => {
		expect(entityGenerator.generate(schemas.scalarsSchema.model, { includeDeprecated: true })).toMatchSnapshot()
	})

	test('generate for has enum', () => {
		expect(entityGenerator.generate(schemas.enumSchema.model)).toMatchSnapshot()
	})

	test('generate for has enum deprecated', () => {
		expect(entityGenerator.generate(schemas.enumSchema.model, { includeDeprecated: true })).toMatchSnapshot()
	})

	test('generate one has one', () => {
		expect(entityGenerator.generate(schemas.oneHasOneSchema.model)).toMatchSnapshot()
	})

	test('generate one has one deprecated', () => {
		expect(entityGenerator.generate(schemas.oneHasOneSchema.model, { includeDeprecated: true })).toMatchSnapshot()
	})

	test('generate one has many', () => {
		expect(entityGenerator.generate(schemas.oneHasManySchema.model)).toMatchSnapshot()
	})

	test('generate one has many deprecated', () => {
		expect(entityGenerator.generate(schemas.oneHasManySchema.model, { includeDeprecated: true })).toMatchSnapshot()
	})

	test('generate many has many', () => {
		expect(entityGenerator.generate(schemas.manyHasManySchema.model)).toMatchSnapshot()
	})

	test('generate many has many deprecated', () => {
		expect(entityGenerator.generate(schemas.manyHasManySchema.model, { includeDeprecated: true })).toMatchSnapshot()
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

	test('generate reduced has by deprecated', () => {
		expect(entityGenerator.generate(schemas.reducedHasManySchema.model, { includeDeprecated: true })).toMatchSnapshot()
	})

	test('non-deprecated relation to a deprecated entity is dropped (no dangling reference)', () => {
		const output = entityGenerator.generate(schemas.danglingDeprecatedRefSchema.model)
		// the deprecated entity itself is excluded
		expect(output).not.toContain('DeprecatedTarget')
		// and the relation pointing to it must be dropped, otherwise the generated code references a missing type
		expect(output).not.toContain('target:')
	})

	test('non-deprecated relation to a deprecated entity is kept when including deprecated', () => {
		const output = entityGenerator.generate(schemas.danglingDeprecatedRefSchema.model, { includeDeprecated: true })
		expect(output).toContain('export type DeprecatedTarget')
		expect(output).toContain('target: DeprecatedTarget')
	})
})
