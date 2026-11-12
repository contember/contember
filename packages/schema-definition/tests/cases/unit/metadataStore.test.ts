import { describe, expect, test } from 'bun:test'
import { c, InputValidation } from '../../../src/index.js'
import { createLegacyMetadataRegistry, createMetadataStore } from '../../../src/utils/index.js'

describe('legacy metadata registry', () => {
	test('a subclass inherits until it defines its own value', () => {
		const registry = createLegacyMetadataRegistry<string>()
		class Parent {}
		class Child extends Parent {}
		registry.define(Parent, 'parent')
		expect(registry.find(Child)).toEqual({ value: 'parent' })
		registry.define(Child, 'child')
		expect(registry.find(Child)).toEqual({ value: 'child' })
		expect(registry.find(Parent)).toEqual({ value: 'parent' })
	})

	test('class-level and member-level entries are separate', () => {
		const registry = createLegacyMetadataRegistry<number>()
		class Entity {}
		registry.define(Entity.prototype, 1, 'title')
		expect(registry.find(Entity.prototype, 'title')).toEqual({ value: 1 })
		expect(registry.find(Entity.prototype, 'other')).toBeUndefined()
		expect(registry.find(Entity.prototype)).toBeUndefined()
		expect(registry.find(Entity)).toBeUndefined()
	})

	test('stored falsy values are found', () => {
		const registry = createLegacyMetadataRegistry<number | null>()
		class Entity {}
		registry.define(Entity, null)
		expect(registry.find(Entity)).toEqual({ value: null })
	})

	test('separate registries do not share entries', () => {
		const a = createLegacyMetadataRegistry<string>()
		const b = createLegacyMetadataRegistry<string>()
		class Entity {}
		a.define(Entity, 'a')
		expect(b.find(Entity)).toBeUndefined()
	})
})

describe('metadata store', () => {
	test('returns the initial value, then the updated one, and is inherited', () => {
		const store = createMetadataStore<string[]>([])
		class Parent {}
		class Child extends Parent {}
		expect(store.get(Parent)).toEqual([])
		store.update(Parent, current => [...current, 'a'])
		store.update(Child, current => [...current, 'b'])
		expect(store.get(Parent)).toEqual(['a'])
		expect(store.get(Child)).toEqual(['a', 'b'])
	})
})

describe('input validation rules on legacy decorators', () => {
	test('rules from stacked decorators are collected per field', () => {
		class Article {
			@InputValidation.required('Title is required')
			@InputValidation.assertMinLength(3, 'Too short')
			title = c.stringColumn()

			lead = c.stringColumn()
		}
		const schema = InputValidation.parseDefinition({ Article })
		expect(Object.keys(schema.Article)).toEqual(['title'])
		expect(schema.Article.title.map(it => it.message.text)).toEqual(['Title is required', 'Too short'])
	})
})
