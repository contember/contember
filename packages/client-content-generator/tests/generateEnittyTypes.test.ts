import { describe, expect, test } from 'bun:test'
import { EntityTypeSchemaGenerator } from '../src'
import { schemas } from './schemas'


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

	test('generate reduced has by deprecated', () => {

		expect(entityGenerator.generate(schemas.reducedHasManySchema.model, { includeDeprecated: true })).toMatchSnapshot()
	})

})
