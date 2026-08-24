import { expect, test } from 'bun:test'
import { Acl } from '@contember/schema'
import { AclValidator } from '../../../src/index.js'
import { c, createSchema } from '@contember/schema-definition'

namespace ThroughAclSchema {
	export const editorRole = c.createRole('editor', { stages: '*' })

	@c.Allow(editorRole, { read: ['title'] })
	@c.Allow(editorRole, {
		through: true,
		when: { archived: { eq: false } },
		read: ['internalNote'],
		update: ['internalNote'],
		delete: true,
	})
	export class Article {
		title = c.stringColumn()
		internalNote = c.stringColumn()
		archived = c.boolColumn().notNull()
	}
}

const schema = createSchema(ThroughAclSchema)

const aclWith = (operations: Acl.EntityOperations, predicates: Acl.PredicateMap = {}): Acl.Schema => ({
	roles: {
		editor: {
			variables: {},
			entities: {
				Article: { predicates, operations },
			},
		},
	},
})

const validate = (acl: Acl.Schema): ReturnType<AclValidator['validate']> => new AclValidator(schema.model).validate(acl)

const operationsPath = ['acl', 'editor', 'entities', 'Article', 'operations']

test('a valid through bucket produces no errors', () => {
	expect(validate(schema.acl)).toStrictEqual([])
})

test('through.read on a field that does not exist on the entity', () => {
	const errors = validate(aclWith({
		read: { title: true },
		through: { read: { nonExisting: true } },
	}))

	expect(errors).toStrictEqual([
		{
			code: 'ACL_UNDEFINED_FIELD',
			message: 'Field nonExisting not found on entity Article',
			path: [...operationsPath, 'through', 'read'],
		},
	])
})

test('through.update referencing an undefined predicate', () => {
	const errors = validate(aclWith({
		through: { update: { internalNote: 'missingPredicate' } },
	}))

	expect(errors).toStrictEqual([
		{
			code: 'ACL_UNDEFINED_PREDICATE',
			message: 'Predicate missingPredicate not found',
			path: [...operationsPath, 'through', 'update', 'internalNote'],
		},
	])
})

test('through.delete referencing an undefined predicate', () => {
	const errors = validate(aclWith({
		through: { delete: 'missingPredicate' },
	}))

	expect(errors).toStrictEqual([
		{
			code: 'ACL_UNDEFINED_PREDICATE',
			message: 'Predicate missingPredicate not found',
			path: [...operationsPath, 'through', 'delete'],
		},
	])
})

test('through.create on a field that does not exist and with an undefined predicate', () => {
	const errors = validate(aclWith({
		through: { create: { nonExisting: 'missingPredicate' } },
	}))

	expect(errors).toStrictEqual([
		{
			code: 'ACL_UNDEFINED_FIELD',
			message: 'Field nonExisting not found on entity Article',
			path: [...operationsPath, 'through', 'create'],
		},
		{
			code: 'ACL_UNDEFINED_PREDICATE',
			message: 'Predicate missingPredicate not found',
			path: [...operationsPath, 'through', 'create', 'nonExisting'],
		},
	])
})

test('root operations keep reporting undefined fields and predicates', () => {
	const errors = validate(aclWith({
		read: { nonExisting: true },
		update: { internalNote: 'missingPredicate' },
		delete: 'missingPredicate',
	}))

	expect(errors).toStrictEqual([
		{
			code: 'ACL_UNDEFINED_PREDICATE',
			message: 'Predicate missingPredicate not found',
			path: [...operationsPath, 'delete'],
		},
		{
			code: 'ACL_UNDEFINED_FIELD',
			message: 'Field nonExisting not found on entity Article',
			path: [...operationsPath, 'read'],
		},
		{
			code: 'ACL_UNDEFINED_PREDICATE',
			message: 'Predicate missingPredicate not found',
			path: [...operationsPath, 'update', 'internalNote'],
		},
	])
})

test('operation flags and legacy noRoot are not mistaken for grants', () => {
	const errors = validate(aclWith({
		read: { title: 'published' },
		update: { title: 'published' },
		delete: 'published',
		through: { read: { internalNote: 'published' } },
		noRoot: ['update', 'delete'],
		customPrimary: true,
		refreshMaterializedView: true,
	}, { published: { archived: { eq: false } } }))

	expect(errors).toStrictEqual([])
})
