import { expect, test } from 'bun:test'
import { Acl, Model } from '@contember/schema'
import { c, createSchema } from '@contember/schema-definition'
import { AclValidator } from '../../../src/index.js'

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
