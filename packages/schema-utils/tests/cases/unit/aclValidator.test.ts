import { expect, test } from 'bun:test'
import { Acl, Model } from '@contember/schema'
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

namespace TransitionModel {
	export class Article {
		state = c.stringColumn().notNull()
	}
}

const model: Model.Schema = createSchema(TransitionModel).model

const buildAcl = (predicate: Acl.PredicateDefinition): Acl.Schema => ({
	roles: {
		editor: {
			variables: {},
			entities: {
				Article: {
					predicates: { transition: predicate },
					operations: {
						update: { id: 'transition', state: 'transition' },
					},
				},
			},
		},
	},
})

test('accepts old/new markers at the top level', () => {
	const errors = new AclValidator(model).validate(buildAcl({
		_old: { state: { eq: 'A' } },
		_new: { state: { eq: 'B' } },
	} as unknown as Acl.PredicateDefinition))
	expect(errors).toEqual([])
})

test('accepts old/new markers inside and', () => {
	const errors = new AclValidator(model).validate(buildAcl({
		and: [{ _new: { state: { eq: 'B' } } }],
	} as unknown as Acl.PredicateDefinition))
	expect(errors).toEqual([])
})

test('rejects old/new markers inside or', () => {
	const errors = new AclValidator(model).validate(buildAcl({
		or: [{ _new: { state: { eq: 'B' } } }],
	} as unknown as Acl.PredicateDefinition))
	expect(errors.map(it => it.code)).toContain('ACL_INVALID_STATE_MARKER')
})

test('rejects old/new markers inside not', () => {
	const errors = new AclValidator(model).validate(buildAcl({
		not: { _old: { state: { eq: 'A' } } },
	} as unknown as Acl.PredicateDefinition))
	expect(errors.map(it => it.code)).toContain('ACL_INVALID_STATE_MARKER')
})

test('rejects nested markers', () => {
	const errors = new AclValidator(model).validate(buildAcl({
		_old: { _new: { state: { eq: 'A' } } },
	} as unknown as Acl.PredicateDefinition))
	expect(errors.map(it => it.code)).toContain('ACL_INVALID_STATE_MARKER')
})

test('validates fields inside markers', () => {
	const errors = new AclValidator(model).validate(buildAcl({
		_new: { unknownField: { eq: 'B' } },
	} as unknown as Acl.PredicateDefinition))
	expect(errors.map(it => it.code)).toContain('ACL_UNDEFINED_FIELD')
})
