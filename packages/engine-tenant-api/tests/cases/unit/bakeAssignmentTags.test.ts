import { describe, expect, test } from 'bun:test'
import { bakeAssignmentTags } from '../../../src/model/policy/index.js'
import type { Statement } from '@contember/policy'

/**
 * Tag-scoped assignment is the mechanism that lets one shared policy be reused
 * per identity with a different concrete scope. The substitution of
 * `${assignment.tags.*}` into actions / resources / condition values at load
 * time was previously asserted nowhere (every other test baked with `{}`), even
 * though the grant boundary relies on it checking the *baked* document.
 */
const tagContext = { assignment: { tags: { project: 'acme', tier: 'gold' }, policySlug: 'project-viewer' } }

describe('bakeAssignmentTags', () => {
	test('substitutes ${assignment.tags.*} inside resource strings', () => {
		const stmt: Statement = {
			effect: 'allow',
			actions: ['tenant:project.view'],
			resources: ['project:${assignment.tags.project}'],
		}
		expect(bakeAssignmentTags(stmt, tagContext).resources).toEqual(['project:acme'])
	})

	test('substitutes inside action strings', () => {
		const stmt: Statement = {
			effect: 'allow',
			actions: ['tenant:${assignment.tags.project}.view'],
		}
		expect(bakeAssignmentTags(stmt, tagContext).actions).toEqual(['tenant:acme.view'])
	})

	test('substitutes inside condition values, element-wise for arrays', () => {
		const stmt: Statement = {
			effect: 'allow',
			actions: ['tenant:project.addMember'],
			conditions: {
				stringEquals: { 'subject.membership.variables.project': '${assignment.tags.project}' },
				'forAllValues:stringEquals': { 'subject.membership.variables.tier': ['${assignment.tags.tier}', 'platinum'] },
			},
		}
		const baked = bakeAssignmentTags(stmt, tagContext)
		expect(baked.conditions).toEqual({
			stringEquals: { 'subject.membership.variables.project': 'acme' },
			'forAllValues:stringEquals': { 'subject.membership.variables.tier': ['gold', 'platinum'] },
		})
	})

	test('leaves non-assignment placeholders intact for engine-time resolution', () => {
		const stmt: Statement = {
			effect: 'allow',
			actions: ['tenant:project.view'],
			resources: ['project:${assignment.tags.project}'],
			conditions: { stringEquals: { 'identity.id': '${identity.id}' } },
		}
		const baked = bakeAssignmentTags(stmt, tagContext)
		expect(baked.resources).toEqual(['project:acme'])
		expect(baked.conditions).toEqual({ stringEquals: { 'identity.id': '${identity.id}' } })
	})

	test('preserves effect and tolerates statements without resources/conditions', () => {
		const stmt: Statement = {
			effect: 'deny',
			actions: ['tenant:person.disable'],
		}
		const baked = bakeAssignmentTags(stmt, tagContext)
		expect(baked.effect).toBe('deny')
		expect(baked.actions).toEqual(['tenant:person.disable'])
		expect(baked.resources).toBeUndefined()
		expect(baked.conditions).toBeUndefined()
	})

	test('an unknown tag placeholder leaves the original token (resolved/denied later, never widened)', () => {
		const stmt: Statement = {
			effect: 'allow',
			actions: ['tenant:project.view'],
			resources: ['project:${assignment.tags.missing}'],
		}
		// substituteValue leaves unresolved placeholders untouched; the engine then
		// treats the unresolved resource fail-closed rather than matching `*`.
		expect(bakeAssignmentTags(stmt, tagContext).resources).toEqual(['project:${assignment.tags.missing}'])
	})
})
