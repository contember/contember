import { describe, expect, test } from 'vitest'
import { EntityTypeSchemaGenerator } from '../src'
import { schemas } from './schemas'


describe('generate entities', () => {

	const entityGenerator = new EntityTypeSchemaGenerator()
	test('generate for scalars', () => {

		expect(entityGenerator.generate(schemas.scalarsSchema.model)).toMatchInlineSnapshot(`
			"
			export type JSONPrimitive = string | number | boolean | null
			export type JSONValue = JSONPrimitive | JSONObject | JSONArray
			export type JSONObject = { readonly [K in string]?: JSONValue }
			export type JSONArray = readonly JSONValue[]

			export type Foo <OverRelation extends string | never = never> = {
				name: 'Foo'
				unique:
					| Omit<{ id: string}, OverRelation>
				columns: {
					id: string
					stringCol: string | null
					intCol: number | null
					doubleCol: number | null
					dateCol: string | null
					datetimeCol: string | null
					booleanCol: boolean | null
					jsonCol: JSONValue | null
					uuidCol: string | null
				}
				hasOne: {
				}
				hasMany: {
				}
				hasManyBy: {
				}
			}

			export type ContemberClientEntities = {
				Foo: Foo
			}

			export type ContemberClientSchema = {
				entities: ContemberClientEntities
			}
			"
		`)
	})

	test('generate for has enum', () => {

		expect(entityGenerator.generate(schemas.enumSchema.model)).toMatchInlineSnapshot(`
			"import type { FooEnumCol } from './enums'

			export type JSONPrimitive = string | number | boolean | null
			export type JSONValue = JSONPrimitive | JSONObject | JSONArray
			export type JSONObject = { readonly [K in string]?: JSONValue }
			export type JSONArray = readonly JSONValue[]

			export type Foo <OverRelation extends string | never = never> = {
				name: 'Foo'
				unique:
					| Omit<{ id: string}, OverRelation>
				columns: {
					id: string
					enumCol: FooEnumCol | null
				}
				hasOne: {
				}
				hasMany: {
				}
				hasManyBy: {
				}
			}

			export type ContemberClientEntities = {
				Foo: Foo
			}

			export type ContemberClientSchema = {
				entities: ContemberClientEntities
			}
			"
		`)
	})
	test('generate one has one', () => {

		expect(entityGenerator.generate(schemas.oneHasOneSchema.model)).toMatchInlineSnapshot(`
			"
			export type JSONPrimitive = string | number | boolean | null
			export type JSONValue = JSONPrimitive | JSONObject | JSONArray
			export type JSONObject = { readonly [K in string]?: JSONValue }
			export type JSONArray = readonly JSONValue[]

			export type Foo <OverRelation extends string | never = never> = {
				name: 'Foo'
				unique:
					| Omit<{ id: string}, OverRelation>
					| Omit<{ oneHasOneInverseRel: Bar['unique']}, OverRelation>
				columns: {
					id: string
				}
				hasOne: {
					oneHasOneInverseRel: Bar
				}
				hasMany: {
				}
				hasManyBy: {
				}
			}
			export type Bar <OverRelation extends string | never = never> = {
				name: 'Bar'
				unique:
					| Omit<{ id: string}, OverRelation>
					| Omit<{ oneHasOneOwningRel: Foo['unique']}, OverRelation>
				columns: {
					id: string
				}
				hasOne: {
					oneHasOneOwningRel: Foo
				}
				hasMany: {
				}
				hasManyBy: {
				}
			}

			export type ContemberClientEntities = {
				Foo: Foo
				Bar: Bar
			}

			export type ContemberClientSchema = {
				entities: ContemberClientEntities
			}
			"
		`)
	})

	test('generate one has many', () => {

		expect(entityGenerator.generate(schemas.oneHasManySchema.model)).toMatchInlineSnapshot(`
			"
			export type JSONPrimitive = string | number | boolean | null
			export type JSONValue = JSONPrimitive | JSONObject | JSONArray
			export type JSONObject = { readonly [K in string]?: JSONValue }
			export type JSONArray = readonly JSONValue[]

			export type Foo <OverRelation extends string | never = never> = {
				name: 'Foo'
				unique:
					| Omit<{ id: string}, OverRelation>
					| Omit<{ oneHasManyRel: Bar['unique']}, OverRelation>
				columns: {
					id: string
				}
				hasOne: {
				}
				hasMany: {
					oneHasManyRel: Bar<'manyHasOneRel'>
				}
				hasManyBy: {
				}
			}
			export type Bar <OverRelation extends string | never = never> = {
				name: 'Bar'
				unique:
					| Omit<{ id: string}, OverRelation>
				columns: {
					id: string
				}
				hasOne: {
					manyHasOneRel: Foo
				}
				hasMany: {
				}
				hasManyBy: {
				}
			}

			export type ContemberClientEntities = {
				Foo: Foo
				Bar: Bar
			}

			export type ContemberClientSchema = {
				entities: ContemberClientEntities
			}
			"
		`)
	})

	test('generate many has many', () => {

		expect(entityGenerator.generate(schemas.manyHasManySchema.model)).toMatchInlineSnapshot(`
			"
			export type JSONPrimitive = string | number | boolean | null
			export type JSONValue = JSONPrimitive | JSONObject | JSONArray
			export type JSONObject = { readonly [K in string]?: JSONValue }
			export type JSONArray = readonly JSONValue[]

			export type Foo <OverRelation extends string | never = never> = {
				name: 'Foo'
				unique:
					| Omit<{ id: string}, OverRelation>
				columns: {
					id: string
				}
				hasOne: {
				}
				hasMany: {
					manyHasManyRel: Bar
				}
				hasManyBy: {
				}
			}
			export type Bar <OverRelation extends string | never = never> = {
				name: 'Bar'
				unique:
					| Omit<{ id: string}, OverRelation>
				columns: {
					id: string
				}
				hasOne: {
				}
				hasMany: {
					manyHasManyInverseRel: Foo
				}
				hasManyBy: {
				}
			}

			export type ContemberClientEntities = {
				Foo: Foo
				Bar: Bar
			}

			export type ContemberClientSchema = {
				entities: ContemberClientEntities
			}
			"
		`)
	})

	test('generate reduced has by', () => {

		expect(entityGenerator.generate(schemas.reducedHasManySchema.model)).toMatchInlineSnapshot(`
			"
			export type JSONPrimitive = string | number | boolean | null
			export type JSONValue = JSONPrimitive | JSONObject | JSONArray
			export type JSONObject = { readonly [K in string]?: JSONValue }
			export type JSONArray = readonly JSONValue[]

			export type Foo <OverRelation extends string | never = never> = {
				name: 'Foo'
				unique:
					| Omit<{ id: string}, OverRelation>
					| Omit<{ locales: FooLocale['unique']}, OverRelation>
				columns: {
					id: string
				}
				hasOne: {
				}
				hasMany: {
					locales: FooLocale<'foo'>
				}
				hasManyBy: {
					localesByLocale: { entity: FooLocale; by: {locale: string}  }
				}
			}
			export type FooLocale <OverRelation extends string | never = never> = {
				name: 'FooLocale'
				unique:
					| Omit<{ id: string}, OverRelation>
					| Omit<{ locale: string, foo: Foo['unique']}, OverRelation>
				columns: {
					id: string
					locale: string
				}
				hasOne: {
					foo: Foo
				}
				hasMany: {
				}
				hasManyBy: {
				}
			}

			export type ContemberClientEntities = {
				Foo: Foo
				FooLocale: FooLocale
			}

			export type ContemberClientSchema = {
				entities: ContemberClientEntities
			}
			"
		`)
	})

})
