import { expect, test } from 'bun:test'
import { splitEntityPermissions } from '../../../src/index.js'
import { Acl } from '@contember/schema'

const predicates: Acl.PredicateMap = {
	rootPredicate: { isPublic: { eq: true } },
	throughPredicate: { isArchived: { eq: false } },
}

test('an entity without through grants splits into itself and nothing', () => {
	const permissions: Acl.EntityPermissions = {
		predicates,
		operations: {
			read: { id: true, title: true },
			delete: 'rootPredicate',
			customPrimary: true,
		},
	}
	const { root, through } = splitEntityPermissions(permissions)

	expect(root.operations).toStrictEqual(permissions.operations)
	expect(through.operations).toStrictEqual({})
	expect(root.predicates).toBe(predicates)
	expect(through.predicates).toBe(predicates)
})

test('root and through grants on the same operation stay separate', () => {
	const { root, through } = splitEntityPermissions({
		predicates,
		operations: {
			read: { id: 'rootPredicate', title: 'rootPredicate' },
			through: {
				read: { secret: 'throughPredicate' },
				update: { secret: 'throughPredicate' },
			},
		},
	})

	expect(root.operations).toStrictEqual({ read: { id: 'rootPredicate', title: 'rootPredicate' } })
	expect(through.operations).toStrictEqual({
		read: { secret: 'throughPredicate' },
		update: { secret: 'throughPredicate' },
	})
})

test('legacy noRoot moves the whole operation into the through bucket', () => {
	const { root, through } = splitEntityPermissions({
		predicates,
		operations: {
			read: { id: true, title: true },
			update: { title: 'rootPredicate' },
			delete: 'rootPredicate',
			noRoot: ['update', 'delete'],
			refreshMaterializedView: true,
		},
	})

	expect(root.operations).toStrictEqual({
		read: { id: true, title: true },
		refreshMaterializedView: true,
	})
	expect(through.operations).toStrictEqual({
		update: { title: 'rootPredicate' },
		delete: 'rootPredicate',
	})
})

test('splitting is idempotent over its own root output', () => {
	const once = splitEntityPermissions({
		predicates,
		operations: {
			read: { id: true },
			update: { title: 'rootPredicate' },
			noRoot: ['update'],
		},
	})
	const twice = splitEntityPermissions(once.root)

	expect(twice.root.operations).toStrictEqual(once.root.operations)
	expect(twice.through.operations).toStrictEqual({})
})

test('a noRoot entry for an operation with no grant drops nothing', () => {
	const { root, through } = splitEntityPermissions({
		predicates,
		operations: {
			read: { id: true },
			noRoot: ['update'],
		},
	})

	expect(root.operations).toStrictEqual({ read: { id: true } })
	expect(through.operations).toStrictEqual({})
})

test('a legacy noRoot grant survives an empty declared through bucket for the same operation', () => {
	const { root, through } = splitEntityPermissions({
		predicates,
		operations: {
			read: { title: true, content: true },
			noRoot: ['read'],
			through: { read: {} },
		},
	})

	expect(root.operations).toStrictEqual({})
	expect(through.operations).toStrictEqual({ read: { title: true, content: true } })
})

test('a legacy noRoot grant merges with a populated declared through bucket', () => {
	const { root, through } = splitEntityPermissions({
		predicates,
		operations: {
			read: { title: true, content: true },
			noRoot: ['read'],
			through: { read: { secret: 'throughPredicate' } },
		},
	})

	expect(root.operations).toStrictEqual({})
	expect(through.operations).toStrictEqual({
		read: { title: true, content: true, secret: 'throughPredicate' },
	})
})

test('the declared through grant wins on a field both grants name', () => {
	const { root, through } = splitEntityPermissions({
		predicates,
		operations: {
			read: { title: true, content: 'rootPredicate' },
			noRoot: ['read'],
			through: { read: { title: 'throughPredicate' } },
		},
	})

	expect(root.operations).toStrictEqual({})
	expect(through.operations).toStrictEqual({
		read: { title: 'throughPredicate', content: 'rootPredicate' },
	})
})

test('a legacy noRoot delete survives a through bucket that does not declare delete', () => {
	const { root, through } = splitEntityPermissions({
		predicates,
		operations: {
			delete: 'rootPredicate',
			noRoot: ['delete'],
			through: { read: { secret: 'throughPredicate' } },
		},
	})

	expect(root.operations).toStrictEqual({})
	expect(through.operations).toStrictEqual({
		read: { secret: 'throughPredicate' },
		delete: 'rootPredicate',
	})
})

test('a declared through delete wins over a legacy noRoot delete', () => {
	const { root, through } = splitEntityPermissions({
		predicates,
		operations: {
			delete: 'rootPredicate',
			noRoot: ['delete'],
			through: { delete: 'throughPredicate' },
		},
	})

	expect(root.operations).toStrictEqual({})
	expect(through.operations).toStrictEqual({ delete: 'throughPredicate' })
})
