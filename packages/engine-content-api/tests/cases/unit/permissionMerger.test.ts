import { Acl, Model } from '@contember/schema'
import { PermissionFactory } from '../../../src/acl/index.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { describe, it } from 'bun:test'
import { emptySchema } from '@contember/schema-utils'
import { assert } from '../../src/assert.js'

interface Test {
	acl: Acl.Schema
	roles: string[]
	result: Acl.Permissions
}

interface ContextualTest {
	acl: Acl.Schema
	roles: string[]
	rootResult: Acl.Permissions
	allResult: Acl.Permissions
}

const execute = (test: Test) => {
	const model: Model.Schema = new SchemaBuilder()
		.entity('Entity1', e => e.column('lorem').column('bar'))
		.entity('Entity2', e => e.oneHasOne('xyz', r => r.target('Entity1')))
		.buildSchema()
	const merger = new PermissionFactory()
	const initialAcl = JSON.parse(JSON.stringify(test.acl))
	const result = merger.create({
		...emptySchema,
		model,
		acl: test.acl,
	}, test.roles)
	assert.deepStrictEqual(result, test.result)
	assert.deepStrictEqual(test.acl, initialAcl)
}

const executeContextual = (test: ContextualTest) => {
	const model: Model.Schema = new SchemaBuilder()
		.entity('Entity1', e => e.column('lorem').column('bar'))
		.entity('Entity2', e => e.oneHasOne('xyz', r => r.target('Entity1')))
		.buildSchema()
	const factory = new PermissionFactory()
	const { root, all } = factory.createContextual({
		...emptySchema,
		model,
		acl: test.acl,
	}, test.roles)
	assert.deepStrictEqual(root, test.rootResult)
	assert.deepStrictEqual(all, test.allResult)
}

describe('Permission merger', () => {
	it('merge inheritance', () => {
		execute({
			acl: {
				roles: {
					role1: {
						variables: {},
						stages: '*',
						entities: {
							Entity1: {
								predicates: {},
								operations: {
									read: {
										id: true,
									},
								},
							},
						},
					},
					role2: {
						variables: {},
						inherits: ['role1'],
						stages: '*',
						entities: {
							Entity2: {
								predicates: {},
								operations: {
									read: {
										id: true,
									},
								},
							},
						},
					},
				},
			},
			roles: ['role2'],
			result: {
				Entity1: {
					predicates: {},
					operations: {
						read: {
							id: true,
						},
					},
				},
				Entity2: {
					predicates: {},
					operations: {
						read: {
							id: true,
						},
					},
				},
			},
		})
	})

	it('merge entity operations', () => {
		execute({
			acl: {
				roles: {
					role1: {
						variables: {},
						stages: '*',
						entities: {
							Entity1: {
								predicates: {},
								operations: {
									read: {
										id: true,
									},
								},
							},
						},
					},
					role2: {
						variables: {},
						stages: '*',
						entities: {
							Entity1: {
								predicates: {},
								operations: {
									read: {
										title: true,
									},
								},
							},
						},
					},
				},
			},
			roles: ['role1', 'role2'],
			result: {
				Entity1: {
					predicates: {},
					operations: {
						read: {
							id: true,
							title: true,
						},
					},
				},
			},
		})
	})

	it('merge entity operations with predicates', () => {
		execute({
			acl: {
				roles: {
					role1: {
						variables: {},
						stages: '*',
						entities: {
							Entity1: {
								predicates: {},
								operations: {
									read: {
										id: true,
									},
								},
							},
						},
					},
					role2: {
						variables: {},
						stages: '*',
						entities: {
							Entity1: {
								predicates: {
									foo: { bar: { eq: 'abc' } },
								},
								operations: {
									read: {
										title: 'foo',
									},
								},
							},
						},
					},
				},
			},
			roles: ['role1', 'role2'],
			result: {
				Entity1: {
					predicates: {
						foo: { bar: { eq: 'abc' } },
					},
					operations: {
						read: {
							id: true,
							title: 'foo',
						},
					},
				},
			},
		})
	})

	it('merge entity operations and drops predicate', () => {
		execute({
			acl: {
				roles: {
					role1: {
						variables: {},

						stages: '*',
						entities: {
							Entity1: {
								predicates: {},
								operations: {
									read: {
										id: true,
										title: true,
									},
								},
							},
						},
					},
					role2: {
						variables: {},
						stages: '*',
						entities: {
							Entity1: {
								predicates: {
									foo: { bar: { eq: 'abc' } },
								},
								operations: {
									read: {
										title: 'foo',
									},
								},
							},
						},
					},
				},
			},
			roles: ['role1', 'role2'],
			result: {
				Entity1: {
					predicates: {},
					operations: {
						read: {
							id: true,
							title: true,
						},
					},
				},
			},
		})
	})

	it('merge entity operations and merges predicates', () => {
		execute({
			acl: {
				roles: {
					role1: {
						variables: {},
						stages: '*',
						entities: {
							Entity1: {
								predicates: {
									bar: { lorem: { eq: 'ipsum' } },
								},
								operations: {
									read: {
										id: true,
										title: 'bar',
									},
								},
							},
						},
					},
					role2: {
						variables: {},
						stages: '*',
						entities: {
							Entity1: {
								predicates: {
									foo: { bar: { eq: 'abc' } },
								},
								operations: {
									read: {
										title: 'foo',
									},
								},
							},
						},
					},
				},
			},
			roles: ['role1', 'role2'],
			result: {
				Entity1: {
					predicates: {
						__merge__bar__foo: {
							or: [{ lorem: { eq: 'ipsum' } }, { bar: { eq: 'abc' } }],
						},
					},
					operations: {
						read: {
							id: true,
							title: '__merge__bar__foo',
						},
					},
				},
			},
		})
	})

	it('merge delete operation', () => {
		execute({
			acl: {
				roles: {
					role1: {
						variables: {},
						stages: '*',
						entities: {
							Entity1: {
								predicates: {
									bar: { lorem: { eq: 'ipsum' } },
								},
								operations: {
									delete: 'bar',
								},
							},
						},
					},
					role2: {
						variables: {},
						stages: '*',
						entities: {
							Entity1: {
								predicates: {
									foo: { bar: { eq: 'abc' } },
								},
								operations: {
									delete: 'foo',
								},
							},
						},
					},
				},
			},
			roles: ['role1', 'role2'],
			result: {
				Entity1: {
					predicates: {
						__merge__bar__foo: {
							or: [{ lorem: { eq: 'ipsum' } }, { bar: { eq: 'abc' } }],
						},
					},
					operations: {
						delete: '__merge__bar__foo',
					},
				},
			},
		})
	})

	it('merge predicates and resolves conflicts', () => {
		execute({
			acl: {
				roles: {
					role1: {
						variables: {},
						stages: '*',
						entities: {
							Entity1: {
								predicates: {
									foo: { lorem: { eq: 'ipsum' } },
								},
								operations: {
									read: {
										id: true,
										title: 'foo',
									},
								},
							},
						},
					},
					role2: {
						variables: {},
						stages: '*',
						entities: {
							Entity1: {
								predicates: {
									foo: { bar: { eq: 'abc' } },
								},
								operations: {
									read: {
										content: 'foo',
									},
								},
							},
						},
					},
				},
			},
			roles: ['role1', 'role2'],
			result: {
				Entity1: {
					predicates: {
						foo: { lorem: { eq: 'ipsum' } },
						foo_: { bar: { eq: 'abc' } },
					},
					operations: {
						read: {
							id: true,
							title: 'foo',
							content: 'foo_',
						},
					},
				},
			},
		})
	})

	it('make primary predicate union of all other fields', () => {
		execute({
			acl: {
				roles: {
					role1: {
						variables: {},
						stages: '*',
						entities: {
							Entity1: {
								predicates: {
									foo: { lorem: { eq: 'ipsum' } },
									bar: { lorem: { eq: 'ipsum' } },
								},
								operations: {
									read: {
										title: 'foo',
										description: 'bar',
										content: 'bar',
									},
								},
							},
						},
					},
				},
			},
			roles: ['role1'],
			result: {
				Entity1: {
					predicates: {
						foo: { lorem: { eq: 'ipsum' } },
						bar: { lorem: { eq: 'ipsum' } },
						__merge__foo__bar: {
							or: [{ lorem: { eq: 'ipsum' } }, { lorem: { eq: 'ipsum' } }],
						},
					},
					operations: {
						read: {
							id: '__merge__foo__bar',
							title: 'foo',
							description: 'bar',
							content: 'bar',
						},
					},
				},
			},
		})
	})

	it('prefix variables', () => {
		execute({
			acl: {
				roles: {
					role1: {
						variables: {},
						stages: '*',
						entities: {
							Entity2: {
								predicates: {
									foo: { xyz: { lorem: 'foo' } },
								},
								operations: {
									read: {
										title: 'foo',
									},
								},
							},
						},
					},
				},
			},
			roles: ['role1'],
			result: {
				Entity2: {
					operations: {
						read: {
							title: 'foo',
							id: 'foo',
						},
					},
					predicates: {
						foo: {
							xyz: {
								lorem: 'role1__foo',
							},
						},
					},
				},
			},
		})
	})

	it('prefix inherited variables', () => {
		execute({
			acl: {
				roles: {
					role1: {
						variables: {
							foo: { entityName: 'Test', type: Acl.VariableType.entity },
						},
						stages: '*',
						entities: {
							Entity2: {
								predicates: {
									foo: { xyz: { lorem: 'foo' } },
								},
								operations: {
									read: {
										title: 'foo',
									},
								},
							},
						},
					},
					role2: {
						variables: {},
						entities: {},
						inherits: ['role1'],
						stages: '*',
					},
				},
			},
			roles: ['role2'],
			result: {
				Entity2: {
					operations: {
						read: {
							title: 'foo',
							id: 'foo',
						},
					},
					predicates: {
						foo: {
							xyz: {
								lorem: 'role2__foo',
							},
						},
					},
				},
			},
		})
	})

	it('merge noRootOperations', () => {
		executeContextual({
			acl: {
				roles: {
					role1: {
						variables: {},
						entities: {
							Entity2: {
								predicates: {},
								operations: {
									read: {
										title: true,
									},
									noRoot: ['read'],
								},
							},
						},
					},
					role2: {
						variables: {},
						entities: {
							Entity2: {
								predicates: {},
								operations: {
									read: {
										title: true,
									},
									update: {
										title: true,
									},
									noRoot: ['read', 'update'],
								},
							},
						},
					},
				},
			},
			roles: ['role1', 'role2'],
			// Every grant here is through-only, so nothing is reachable at the root.
			rootResult: {
				Entity2: {
					operations: {},
					predicates: {},
				},
			},
			allResult: {
				Entity2: {
					operations: {
						update: {
							id: true,
							title: true,
						},
						read: {
							id: true,
							title: true,
						},
					},
					predicates: {},
				},
			},
		})
	})

	it('merge delete #1', () => {
		executeContextual({
			acl: {
				roles: {
					role1: {
						variables: {},
						entities: {
							Entity2: {
								predicates: {},
								operations: {
									delete: true,
									noRoot: ['delete'],
								},
							},
						},
					},
					role2: {
						variables: {},
						entities: {
							Entity2: {
								predicates: {},
								operations: {},
							},
						},
					},
				},
			},
			roles: ['role1', 'role2'],
			rootResult: {
				Entity2: {
					operations: {},
					predicates: {},
				},
			},
			allResult: {
				Entity2: {
					operations: {
						delete: true,
					},
					predicates: {},
				},
			},
		})
	})

	it('merge delete #2', () => {
		execute({
			acl: {
				roles: {
					role1: {
						variables: {},
						entities: {
							Entity2: {
								predicates: {},
								operations: {
									delete: true,
									noRoot: ['delete'],
								},
							},
						},
					},
					role2: {
						variables: {},
						entities: {
							Entity2: {
								predicates: {},
								operations: {
									delete: true,
								},
							},
						},
					},
				},
			},
			roles: ['role1', 'role2'],
			result: {
				Entity2: {
					operations: {
						delete: true,
					},
					predicates: {},
				},
			},
		})
	})

	it('merge delete #3', () => {
		executeContextual({
			acl: {
				roles: {
					role1: {
						variables: {},
						entities: {
							Entity2: {
								predicates: {},
								operations: {
									delete: true,
									noRoot: ['delete'],
								},
							},
						},
					},
					role2: {
						variables: {},
						entities: {
							Entity2: {
								predicates: {},
								operations: {},
							},
						},
					},
				},
			},
			roles: ['role1', 'role2'],
			rootResult: {
				Entity2: {
					operations: {},
					predicates: {},
				},
			},
			allResult: {
				Entity2: {
					operations: {
						delete: true,
					},
					predicates: {},
				},
			},
		})
	})

	it('prefer permissions with root allowed', () => {
		execute({
			acl: {
				roles: {
					role1: {
						variables: {},
						entities: {
							Entity2: {
								predicates: {
									foo: { xyz: { lorem: { eq: 'foo' } } },
								},
								operations: {
									read: {
										title: 'foo',
									},
									noRoot: ['read'],
								},
							},
						},
					},
					role2: {
						variables: {},
						entities: {
							Entity2: {
								predicates: {
									foo: { xyz: { lorem: { eq: 'bar' } } },
								},
								operations: {
									read: {
										title: 'foo',
									},
								},
							},
						},
					},
				},
			},
			roles: ['role1', 'role2'],
			result: {
				Entity2: {
					operations: {
						read: {
							title: 'foo_',
							id: 'foo_',
						},
					},
					predicates: {
						foo_: {
							xyz: {
								lorem: { eq: 'bar' },
							},
						},
					},
				},
			},
		})
	})

	it('merge permissions with no root', () => {
		executeContextual({
			acl: {
				roles: {
					role1: {
						variables: {},
						entities: {
							Entity2: {
								predicates: {
									foo: { xyz: { lorem: { eq: 'foo' } } },
								},
								operations: {
									read: {
										title: 'foo',
									},
									noRoot: ['read'],
								},
							},
						},
					},
					role2: {
						variables: {},
						entities: {
							Entity2: {
								predicates: {
									foo: { xyz: { lorem: { eq: 'bar' } } },
								},
								operations: {
									read: {
										title: 'foo',
									},
									noRoot: ['read'],
								},
							},
						},
					},
				},
			},
			roles: ['role1', 'role2'],
			rootResult: {
				Entity2: {
					operations: {},
					predicates: {},
				},
			},
			allResult: {
				Entity2: {
					operations: {
						read: {
							title: '__merge__foo__foo',
							id: '__merge__foo__foo',
						},
					},
					predicates: {
						__merge__foo__foo: {
							or: [
								{ xyz: { lorem: { eq: 'foo' } } },
								{ xyz: { lorem: { eq: 'bar' } } },
							],
						},
					},
				},
			},
		})
	})
})

describe('Contextual permission merger', () => {
	it('createContextual: root drops through-only, all includes both', () => {
		executeContextual({
			acl: {
				roles: {
					throughRole: {
						variables: {},
						entities: {
							Entity2: {
								predicates: {
									foo: { xyz: { lorem: { eq: 'through' } } },
								},
								operations: {
									read: {
										title: 'foo',
									},
									noRoot: ['read'],
								},
							},
						},
					},
					rootRole: {
						variables: {},
						entities: {
							Entity2: {
								predicates: {
									bar: { xyz: { lorem: { eq: 'root' } } },
								},
								operations: {
									read: {
										title: 'bar',
									},
								},
							},
						},
					},
				},
			},
			roles: ['throughRole', 'rootRole'],
			rootResult: {
				Entity2: {
					operations: {
						read: {
							title: 'bar',
							id: 'bar',
						},
					},
					predicates: {
						bar: {
							xyz: {
								lorem: { eq: 'root' },
							},
						},
					},
				},
			},
			allResult: {
				Entity2: {
					operations: {
						read: {
							title: '__merge__foo__bar',
							id: '__merge__foo__bar',
						},
					},
					predicates: {
						__merge__foo__bar: {
							or: [
								{ xyz: { lorem: { eq: 'through' } } },
								{ xyz: { lorem: { eq: 'root' } } },
							],
						},
					},
				},
			},
		})
	})

	it('createContextual: both roles without noRoot produce same root and all', () => {
		executeContextual({
			acl: {
				roles: {
					role1: {
						variables: {},
						entities: {
							Entity1: {
								predicates: {},
								operations: {
									read: {
										id: true,
										lorem: true,
									},
								},
							},
						},
					},
					role2: {
						variables: {},
						entities: {
							Entity1: {
								predicates: {},
								operations: {
									read: {
										id: true,
										bar: true,
									},
								},
							},
						},
					},
				},
			},
			roles: ['role1', 'role2'],
			rootResult: {
				Entity1: {
					predicates: {},
					operations: {
						read: {
							id: true,
							lorem: true,
							bar: true,
						},
					},
				},
			},
			allResult: {
				Entity1: {
					predicates: {},
					operations: {
						read: {
							id: true,
							lorem: true,
							bar: true,
						},
					},
				},
			},
		})
	})
})

describe('Contextual permission merger - through bucket', () => {
	// Returns the raw projections, so a test can assert which operation keys exist: `toEqual` treats an
	// explicitly `undefined` key as absent, which is the one distinction the three-state flags need.
	const buildContextual = (acl: Acl.Schema, roles: string[]) => {
		const model: Model.Schema = new SchemaBuilder()
			.entity('Entity1', e => e.column('lorem').column('bar'))
			.entity('Entity2', e => e.oneHasOne('xyz', r => r.target('Entity1')))
			.buildSchema()
		return new PermissionFactory().createContextual({ ...emptySchema, model, acl }, roles)
	}

	it('single role: root and through grants on the same operation compose', () => {
		executeContextual({
			acl: {
				roles: {
					role1: {
						variables: {},
						entities: {
							Entity1: {
								predicates: {
									rootPred: { lorem: { eq: 'root' } },
									throughPred: { bar: { eq: 'through' } },
								},
								operations: {
									read: { title: 'rootPred' },
									through: {
										read: { content: 'throughPred' },
									},
								},
							},
						},
					},
				},
			},
			roles: ['role1'],
			// The scope projection runs per role, so a single role's through grant never leaks into its root set.
			rootResult: {
				Entity1: {
					operations: {
						read: {
							title: 'rootPred',
							id: 'rootPred',
						},
					},
					// The shared predicate map is handed over untouched, so the unreferenced through predicate stays in it.
					predicates: {
						rootPred: { lorem: { eq: 'root' } },
						throughPred: { bar: { eq: 'through' } },
					},
				},
			},
			allResult: {
				Entity1: {
					operations: {
						read: {
							title: 'rootPred',
							content: 'throughPred',
							id: '__merge__rootPred__throughPred',
						},
					},
					predicates: {
						rootPred: { lorem: { eq: 'root' } },
						throughPred: { bar: { eq: 'through' } },
						__merge__rootPred__throughPred: {
							or: [{ lorem: { eq: 'root' } }, { bar: { eq: 'through' } }],
						},
					},
				},
			},
		})
	})

	it('single role: a through-only entity keeps an empty root entry', () => {
		executeContextual({
			acl: {
				roles: {
					role1: {
						variables: {},
						entities: {
							Entity1: {
								predicates: {},
								operations: {
									through: {
										read: { title: true },
									},
								},
							},
						},
					},
				},
			},
			roles: ['role1'],
			rootResult: {
				Entity1: {
					operations: {},
					predicates: {},
				},
			},
			allResult: {
				Entity1: {
					operations: {
						read: {
							title: true,
							id: true,
						},
					},
					predicates: {},
				},
			},
		})
	})

	it('two roles: through predicates merge in all, root stays empty', () => {
		executeContextual({
			acl: {
				roles: {
					role1: {
						variables: {},
						entities: {
							Entity1: {
								predicates: { throughA: { lorem: { eq: 'a' } } },
								operations: {
									through: {
										read: { title: 'throughA' },
									},
								},
							},
						},
					},
					role2: {
						variables: {},
						entities: {
							Entity1: {
								predicates: { throughB: { lorem: { eq: 'b' } } },
								operations: {
									through: {
										read: { title: 'throughB' },
									},
								},
							},
						},
					},
				},
			},
			roles: ['role1', 'role2'],
			rootResult: {
				Entity1: {
					operations: {},
					predicates: {},
				},
			},
			allResult: {
				Entity1: {
					operations: {
						read: {
							title: '__merge__throughA__throughB',
							id: '__merge__throughA__throughB',
						},
					},
					predicates: {
						__merge__throughA__throughB: {
							or: [{ lorem: { eq: 'a' } }, { lorem: { eq: 'b' } }],
						},
					},
				},
			},
		})
	})

	it('two roles: a root predicate and a through predicate on the same field', () => {
		executeContextual({
			acl: {
				roles: {
					throughRole: {
						variables: {},
						entities: {
							Entity1: {
								predicates: { thr: { lorem: { eq: 'through' } } },
								operations: {
									through: {
										read: { title: 'thr' },
									},
								},
							},
						},
					},
					rootRole: {
						variables: {},
						entities: {
							Entity1: {
								predicates: { rt: { lorem: { eq: 'root' } } },
								operations: {
									read: { title: 'rt' },
								},
							},
						},
					},
				},
			},
			roles: ['throughRole', 'rootRole'],
			rootResult: {
				Entity1: {
					operations: {
						read: {
							title: 'rt',
							id: 'rt',
						},
					},
					predicates: {
						rt: { lorem: { eq: 'root' } },
					},
				},
			},
			allResult: {
				Entity1: {
					operations: {
						read: {
							title: '__merge__thr__rt',
							id: '__merge__thr__rt',
						},
					},
					predicates: {
						__merge__thr__rt: {
							or: [{ lorem: { eq: 'through' } }, { lorem: { eq: 'root' } }],
						},
					},
				},
			},
		})
	})

	it('inherits: a through grant on the parent stays through-only in the child', () => {
		executeContextual({
			acl: {
				roles: {
					base: {
						variables: {},
						entities: {
							Entity1: {
								predicates: { thr: { lorem: { eq: 'inherited' } } },
								operations: {
									through: {
										read: { title: 'thr' },
									},
								},
							},
						},
					},
					child: {
						variables: {},
						inherits: ['base'],
						entities: {
							Entity1: {
								predicates: { own: { bar: { eq: 'own' } } },
								operations: {
									read: { description: 'own' },
								},
							},
						},
					},
				},
			},
			roles: ['child'],
			rootResult: {
				Entity1: {
					operations: {
						read: {
							description: 'own',
							id: 'own',
						},
					},
					predicates: {
						own: { bar: { eq: 'own' } },
					},
				},
			},
			allResult: {
				Entity1: {
					operations: {
						read: {
							title: 'thr',
							description: 'own',
							id: '__merge__thr__own',
						},
					},
					predicates: {
						thr: { lorem: { eq: 'inherited' } },
						own: { bar: { eq: 'own' } },
						__merge__thr__own: {
							or: [{ lorem: { eq: 'inherited' } }, { bar: { eq: 'own' } }],
						},
					},
				},
			},
		})
	})

	it('inherits: a through grant on the child does not affect the inherited root grant', () => {
		executeContextual({
			acl: {
				roles: {
					base: {
						variables: {},
						entities: {
							Entity1: {
								predicates: { rt: { lorem: { eq: 'inherited' } } },
								operations: {
									read: { title: 'rt' },
								},
							},
						},
					},
					child: {
						variables: {},
						inherits: ['base'],
						entities: {
							Entity1: {
								predicates: { thr: { bar: { eq: 'own' } } },
								operations: {
									through: {
										read: { description: 'thr' },
									},
								},
							},
						},
					},
				},
			},
			roles: ['child'],
			rootResult: {
				Entity1: {
					operations: {
						read: {
							title: 'rt',
							id: 'rt',
						},
					},
					predicates: {
						rt: { lorem: { eq: 'inherited' } },
					},
				},
			},
			allResult: {
				Entity1: {
					operations: {
						read: {
							title: 'rt',
							description: 'thr',
							id: '__merge__rt__thr',
						},
					},
					predicates: {
						rt: { lorem: { eq: 'inherited' } },
						thr: { bar: { eq: 'own' } },
						__merge__rt__thr: {
							or: [{ lorem: { eq: 'inherited' } }, { bar: { eq: 'own' } }],
						},
					},
				},
			},
		})
	})

	it('through delete: true is granted under a relation only', () => {
		executeContextual({
			acl: {
				roles: {
					role1: {
						variables: {},
						entities: {
							Entity1: {
								predicates: {},
								operations: {
									read: { title: true },
									through: {
										delete: true,
									},
								},
							},
						},
					},
				},
			},
			roles: ['role1'],
			rootResult: {
				Entity1: {
					operations: {
						read: {
							title: true,
							id: true,
						},
					},
					predicates: {},
				},
			},
			allResult: {
				Entity1: {
					operations: {
						read: {
							title: true,
							id: true,
						},
						delete: true,
					},
					predicates: {},
				},
			},
		})
	})

	it('through delete: a predicate delete composes with the root one', () => {
		executeContextual({
			acl: {
				roles: {
					role1: {
						variables: {},
						entities: {
							Entity1: {
								predicates: {
									rootDel: { lorem: { eq: 'root' } },
									throughDel: { bar: { eq: 'through' } },
								},
								operations: {
									delete: 'rootDel',
									through: {
										delete: 'throughDel',
									},
								},
							},
						},
					},
				},
			},
			roles: ['role1'],
			rootResult: {
				Entity1: {
					operations: {
						delete: 'rootDel',
					},
					predicates: {
						rootDel: { lorem: { eq: 'root' } },
						throughDel: { bar: { eq: 'through' } },
					},
				},
			},
			allResult: {
				Entity1: {
					operations: {
						delete: '__merge__rootDel__throughDel',
					},
					predicates: {
						__merge__rootDel__throughDel: {
							or: [{ lorem: { eq: 'root' } }, { bar: { eq: 'through' } }],
						},
					},
				},
			},
		})
	})

	it('customPrimary and refreshMaterializedView survive the scope projection of an entity with a through bucket', () => {
		executeContextual({
			acl: {
				roles: {
					role1: {
						variables: {},
						entities: {
							Entity1: {
								predicates: {},
								operations: {
									customPrimary: true,
									refreshMaterializedView: true,
									read: { title: true },
									through: {
										read: { content: true },
									},
								},
							},
						},
					},
				},
			},
			roles: ['role1'],
			rootResult: {
				Entity1: {
					operations: {
						customPrimary: true,
						refreshMaterializedView: true,
						read: {
							title: true,
							id: true,
						},
					},
					predicates: {},
				},
			},
			allResult: {
				Entity1: {
					operations: {
						customPrimary: true,
						refreshMaterializedView: true,
						read: {
							title: true,
							content: true,
							id: true,
						},
					},
					predicates: {},
				},
			},
		})
	})

	it('customPrimary and refreshMaterializedView survive the scope projection that short-circuits without a through bucket', () => {
		executeContextual({
			acl: {
				roles: {
					role1: {
						variables: {},
						entities: {
							Entity1: {
								predicates: {},
								operations: {
									customPrimary: true,
									refreshMaterializedView: true,
									read: { title: true },
								},
							},
						},
					},
				},
			},
			roles: ['role1'],
			rootResult: {
				Entity1: {
					operations: {
						customPrimary: true,
						refreshMaterializedView: true,
						read: {
							title: true,
							id: true,
						},
					},
					predicates: {},
				},
			},
			allResult: {
				Entity1: {
					operations: {
						customPrimary: true,
						refreshMaterializedView: true,
						read: {
							title: true,
							id: true,
						},
					},
					predicates: {},
				},
			},
		})
	})

	it('two roles: refreshMaterializedView is granted if any role grants it', () => {
		executeContextual({
			acl: {
				roles: {
					viewRole: {
						variables: {},
						entities: {
							Entity1: {
								predicates: {},
								operations: {
									refreshMaterializedView: true,
									read: { title: true },
								},
							},
						},
					},
					otherRole: {
						variables: {},
						entities: {
							Entity1: {
								predicates: {},
								operations: {
									read: { description: true },
									through: {
										read: { content: true },
									},
								},
							},
						},
					},
				},
			},
			roles: ['viewRole', 'otherRole'],
			rootResult: {
				Entity1: {
					operations: {
						refreshMaterializedView: true,
						read: {
							title: true,
							description: true,
							id: true,
						},
					},
					predicates: {},
				},
			},
			allResult: {
				Entity1: {
					operations: {
						refreshMaterializedView: true,
						read: {
							title: true,
							description: true,
							content: true,
							id: true,
						},
					},
					predicates: {},
				},
			},
		})
	})

	it('an explicit customPrimary and refreshMaterializedView denial survives the scope projection', () => {
		executeContextual({
			acl: {
				roles: {
					role1: {
						variables: {},
						entities: {
							Entity1: {
								predicates: {},
								operations: {
									customPrimary: false,
									refreshMaterializedView: false,
									read: { title: true },
									through: {
										read: { content: true },
									},
								},
							},
						},
					},
				},
			},
			roles: ['role1'],
			// A dropped `false` would not stay denied: Authorizator resolves the flags with `??`, so an absent
			// key falls back to the role-level default instead of denying.
			rootResult: {
				Entity1: {
					operations: {
						customPrimary: false,
						refreshMaterializedView: false,
						read: {
							title: true,
							id: true,
						},
					},
					predicates: {},
				},
			},
			allResult: {
				Entity1: {
					operations: {
						customPrimary: false,
						refreshMaterializedView: false,
						read: {
							title: true,
							content: true,
							id: true,
						},
					},
					predicates: {},
				},
			},
		})
	})

	it('two roles: an explicit denial loses to another role granting the flag', () => {
		executeContextual({
			acl: {
				roles: {
					denyingRole: {
						variables: {},
						entities: {
							Entity1: {
								predicates: {},
								operations: {
									customPrimary: false,
									refreshMaterializedView: false,
									read: { title: true },
								},
							},
						},
					},
					grantingRole: {
						variables: {},
						entities: {
							Entity1: {
								predicates: {},
								operations: {
									customPrimary: true,
									refreshMaterializedView: true,
									read: { description: true },
								},
							},
						},
					},
				},
			},
			roles: ['denyingRole', 'grantingRole'],
			rootResult: {
				Entity1: {
					operations: {
						customPrimary: true,
						refreshMaterializedView: true,
						read: {
							title: true,
							description: true,
							id: true,
						},
					},
					predicates: {},
				},
			},
			allResult: {
				Entity1: {
					operations: {
						customPrimary: true,
						refreshMaterializedView: true,
						read: {
							title: true,
							description: true,
							id: true,
						},
					},
					predicates: {},
				},
			},
		})
	})

	it('flags no role states stay absent, leaving the role-level default in charge', () => {
		const { root, all } = buildContextual({
			roles: {
				role1: {
					variables: {},
					entities: {
						Entity1: {
							predicates: {},
							operations: {
								read: { title: true },
							},
						},
					},
				},
				role2: {
					variables: {},
					entities: {
						Entity1: {
							predicates: {},
							operations: {
								read: { description: true },
								through: {
									read: { content: true },
								},
							},
						},
					},
				},
			},
		}, ['role1', 'role2'])

		// Asserted on the key list, because a `customPrimary: undefined` would compare equal to an absent one.
		assert.deepStrictEqual(Object.keys(root.Entity1.operations), ['read'])
		assert.deepStrictEqual(Object.keys(all.Entity1.operations), ['read'])
		assert.deepStrictEqual(root.Entity1.operations.read, { title: true, description: true, id: true })
		assert.deepStrictEqual(all.Entity1.operations.read, { title: true, description: true, content: true, id: true })
	})

	it('primary predicate is the union of the fields readable in that scope', () => {
		executeContextual({
			acl: {
				roles: {
					role1: {
						variables: {},
						entities: {
							Entity1: {
								predicates: {
									pA: { lorem: { eq: 'a' } },
									pB: { bar: { eq: 'b' } },
									pC: { lorem: { eq: 'c' } },
								},
								operations: {
									read: { title: 'pA', description: 'pB' },
									through: {
										read: { content: 'pC' },
									},
								},
							},
						},
					},
				},
			},
			roles: ['role1'],
			// makePrimaryPredicatesUnionOfAllFields runs once per scope, so root unions only the root fields.
			rootResult: {
				Entity1: {
					operations: {
						read: {
							title: 'pA',
							description: 'pB',
							id: '__merge__pA__pB',
						},
					},
					predicates: {
						pA: { lorem: { eq: 'a' } },
						pB: { bar: { eq: 'b' } },
						pC: { lorem: { eq: 'c' } },
						__merge__pA__pB: {
							or: [{ lorem: { eq: 'a' } }, { bar: { eq: 'b' } }],
						},
					},
				},
			},
			allResult: {
				Entity1: {
					operations: {
						read: {
							title: 'pA',
							description: 'pB',
							content: 'pC',
							id: '__merge____merge__pA__pB__pC',
						},
					},
					predicates: {
						pA: { lorem: { eq: 'a' } },
						pB: { bar: { eq: 'b' } },
						pC: { lorem: { eq: 'c' } },
						__merge__pA__pB: {
							or: [{ lorem: { eq: 'a' } }, { bar: { eq: 'b' } }],
						},
						__merge____merge__pA__pB__pC: {
							or: [
								{ or: [{ lorem: { eq: 'a' } }, { bar: { eq: 'b' } }] },
								{ lorem: { eq: 'c' } },
							],
						},
					},
				},
			},
		})
	})

	it('legacy noRoot and the new through bucket merge into one nested set', () => {
		executeContextual({
			acl: {
				roles: {
					legacyRole: {
						variables: {},
						entities: {
							Entity1: {
								predicates: { legacyPred: { lorem: { eq: 'legacy' } } },
								operations: {
									read: { title: 'legacyPred' },
									noRoot: ['read'],
								},
							},
						},
					},
					throughRole: {
						variables: {},
						entities: {
							Entity1: {
								predicates: { newPred: { bar: { eq: 'new' } } },
								operations: {
									through: {
										read: { title: 'newPred' },
									},
								},
							},
						},
					},
				},
			},
			roles: ['legacyRole', 'throughRole'],
			rootResult: {
				Entity1: {
					operations: {},
					predicates: {},
				},
			},
			allResult: {
				Entity1: {
					operations: {
						read: {
							title: '__merge__legacyPred__newPred',
							id: '__merge__legacyPred__newPred',
						},
					},
					predicates: {
						__merge__legacyPred__newPred: {
							or: [{ lorem: { eq: 'legacy' } }, { bar: { eq: 'new' } }],
						},
					},
				},
			},
		})
	})
})
