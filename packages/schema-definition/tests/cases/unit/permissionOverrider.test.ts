import { expect, test } from 'bun:test'
import { Acl } from '@contember/schema'
import PermissionOverrider from '../../../src/acl/builder/PermissionOverrider.js'

const overrider = new PermissionOverrider()

test('neither side has a through bucket - the result has no through key at all', () => {
	const original: Acl.Permissions = {
		Book: { predicates: {}, operations: { read: { title: true } } },
	}
	const overrides: Acl.Permissions = {
		Book: { predicates: {}, operations: { update: { title: true } } },
	}

	const result = overrider.override(original, overrides)

	expect(result.Book.operations).not.toHaveProperty('through')
	expect(result.Book.operations.read).toEqual({ title: true })
	expect(result.Book.operations.update).toEqual({ title: true })
})

test('only the original has a through bucket - it is carried over unchanged', () => {
	const original: Acl.Permissions = {
		Book: {
			predicates: {},
			operations: { read: { title: true }, through: { read: { secret: true } } },
		},
	}
	const overrides: Acl.Permissions = {
		Book: { predicates: {}, operations: { update: { title: true } } },
	}

	const result = overrider.override(original, overrides)

	expect(result.Book.operations.through?.read).toEqual({ secret: true })
})

test('only the overrides have a through bucket - it is carried over unchanged', () => {
	const original: Acl.Permissions = {
		Book: { predicates: {}, operations: { read: { title: true } } },
	}
	const overrides: Acl.Permissions = {
		Book: {
			predicates: {},
			operations: { update: { title: true }, through: { read: { secret: true } } },
		},
	}

	const result = overrider.override(original, overrides)

	expect(result.Book.operations.through?.read).toEqual({ secret: true })
})

test('both sides have a through bucket - per-operation field maps merge, overrides wins on conflict', () => {
	const original: Acl.Permissions = {
		Book: {
			predicates: {},
			operations: { through: { read: { a: 'predA', common: 'predOriginal' } } },
		},
	}
	const overrides: Acl.Permissions = {
		Book: {
			predicates: {},
			operations: { through: { read: { b: 'predB', common: 'predOverride' } } },
		},
	}

	const result = overrider.override(original, overrides)

	expect(result.Book.operations.through?.read).toEqual({ a: 'predA', b: 'predB', common: 'predOverride' })
})

test('through.delete on neither side - the delete key is absent, not undefined', () => {
	const original: Acl.Permissions = {
		Book: { predicates: {}, operations: { through: { read: { a: true } } } },
	}
	const overrides: Acl.Permissions = {
		Book: { predicates: {}, operations: { through: { read: { b: true } } } },
	}

	const result = overrider.override(original, overrides)

	expect(result.Book.operations.through?.read).toEqual({ a: true, b: true })
	expect(result.Book.operations.through).not.toHaveProperty('delete')
})

test('through.delete only on the original - carried over', () => {
	const original: Acl.Permissions = {
		Book: { predicates: {}, operations: { through: { delete: 'originalDeletePred' } } },
	}
	const overrides: Acl.Permissions = {
		Book: { predicates: {}, operations: { through: { read: { b: true } } } },
	}

	const result = overrider.override(original, overrides)

	expect(result.Book.operations.through?.delete).toBe('originalDeletePred')
	expect(result.Book.operations.through?.read).toEqual({ b: true })
})

test('through.delete only on the overrides - carried over', () => {
	const original: Acl.Permissions = {
		Book: { predicates: {}, operations: { through: { read: { a: true } } } },
	}
	const overrides: Acl.Permissions = {
		Book: { predicates: {}, operations: { through: { delete: 'overrideDeletePred' } } },
	}

	const result = overrider.override(original, overrides)

	expect(result.Book.operations.through?.delete).toBe('overrideDeletePred')
	expect(result.Book.operations.through?.read).toEqual({ a: true })
})

test('through.delete on both sides - the overrides value wins', () => {
	const original: Acl.Permissions = {
		Book: { predicates: {}, operations: { through: { delete: 'originalDeletePred' } } },
	}
	const overrides: Acl.Permissions = {
		Book: { predicates: {}, operations: { through: { delete: 'overrideDeletePred' } } },
	}

	const result = overrider.override(original, overrides)

	expect(result.Book.operations.through?.delete).toBe('overrideDeletePred')
})

test('a through bucket does not disturb how the root path merges', () => {
	const original: Acl.Permissions = {
		Book: {
			predicates: { p1: { foo: { eq: 1 } } },
			operations: {
				read: { title: 'rootPredOriginal', extraOriginal: 'rootPredOriginal' },
				through: { read: { secret: 'throughPredOriginal' } },
			},
		},
	}
	const overrides: Acl.Permissions = {
		Book: {
			predicates: { p2: { foo: { eq: 2 } } },
			operations: {
				read: { title: 'rootPredOverride', extraOverride: 'rootPredOverride' },
				through: { update: { secret: 'throughPredOverride' } },
			},
		},
	}

	const result = overrider.override(original, overrides)

	// root 'read' merges and resolves the 'title' conflict exactly like it did before through existed
	expect(result.Book.operations.read).toEqual({
		title: 'rootPredOverride',
		extraOriginal: 'rootPredOriginal',
		extraOverride: 'rootPredOverride',
	})
	expect(result.Book.operations.through?.read).toEqual({ secret: 'throughPredOriginal' })
	expect(result.Book.operations.through?.update).toEqual({ secret: 'throughPredOverride' })
	expect(result.Book.predicates).toStrictEqual({
		p1: { foo: { eq: 1 } },
		p2: { foo: { eq: 2 } },
	})
})

test('through omits create/update when neither side declares them', () => {
	// An operation nobody declares must stay absent, exactly like `delete` already does. An empty map is
	// indistinguishable from a real grant for anything reading a stored schema back, and it used to make
	// `splitEntityPermissions` treat the through bucket as the owner of the operation.
	const original: Acl.Permissions = {
		Book: { predicates: {}, operations: { through: { read: { a: true } } } },
	}
	const overrides: Acl.Permissions = {
		Book: { predicates: {}, operations: { through: { read: { b: true } } } },
	}

	const result = overrider.override(original, overrides)

	expect(result.Book.operations.through).toStrictEqual({ read: { a: true, b: true } })
	expect(result.Book.operations.through).not.toHaveProperty('create')
	expect(result.Book.operations.through).not.toHaveProperty('update')
})
