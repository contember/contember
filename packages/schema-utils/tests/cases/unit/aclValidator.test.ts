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
		author = c.manyHasOne(Author)
	}

	export class Author {
		name = c.stringColumn()
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

const validateTransition = (predicate: Acl.PredicateDefinition) => new AclValidator(model).validate(buildAcl(predicate))

const transitionPath = ['acl', 'editor', 'entities', 'Article', 'predicates', 'transition']

test('accepts old/new markers at the top level', () => {
	expect(validateTransition({ _old: { state: { eq: 'A' } }, _new: { state: { eq: 'B' } } })).toEqual([])
})

test('accepts old/new markers inside and, or and not', () => {
	expect(validateTransition({
		or: [
			{ _old: { state: { eq: 'A' } }, _new: { state: { eq: 'B' } } },
			{ and: [{ _old: { state: { eq: 'B' } } }, { not: { _new: { state: { eq: 'A' } } } }] },
		],
	})).toEqual([])
})

test('rejects nested markers', () => {
	expect(validateTransition({ _old: { _new: { state: { eq: 'A' } } } })).toStrictEqual([{
		code: 'ACL_INVALID_STATE_MARKER',
		message: 'Marker "_new" cannot be nested inside another "_old"/"_new" marker.',
		path: [...transitionPath, '_old', '_new'],
	}])
})

test('rejects a marker under a relation', () => {
	expect(validateTransition({ or: [{ author: { _old: {} } }] })).toStrictEqual([{
		code: 'ACL_INVALID_STATE_MARKER',
		message:
			'Marker "_old" cannot be used under a relation, it applies only to the updated row. A canX() reference to a predicate with markers ends up here too.',
		path: [...transitionPath, 'or', 'author', '_old'],
	}])
})

test('validates fields inside markers', () => {
	expect(validateTransition({ _new: { unknownField: { eq: 'B' } } }).map(it => it.code)).toEqual(['ACL_UNDEFINED_FIELD'])
})

namespace CanUpdateModel {
	export const editorRole = c.createRole('editor')

	@c.Allow(editorRole, { when: { _old: { state: { eq: 'draft' } }, _new: { state: { eq: 'published' } } }, update: ['state'] })
	export class Article {
		state = c.stringColumn().notNull()
		comments = c.oneHasMany(Comment, 'article')
	}

	@c.Allow(editorRole, { when: { article: c.canUpdate('state') }, update: ['text'] })
	export class Comment {
		text = c.stringColumn()
		article = c.manyHasOne(Article, 'comments').notNull()
	}
}

test('rejects markers reached through a canUpdate() reference', () => {
	const canUpdateSchema = createSchema(CanUpdateModel)
	const errors = new AclValidator(canUpdateSchema.model).validate(canUpdateSchema.acl)
	expect(errors.map(it => [it.code, it.path.join('.')])).toEqual([
		['ACL_INVALID_STATE_MARKER', 'acl.editor.entities.Comment.predicates.article_old_state_eq_draft_ne.article._old'],
		['ACL_INVALID_STATE_MARKER', 'acl.editor.entities.Comment.predicates.article_old_state_eq_draft_ne.article._new'],
	])
})
