import { Acl, Model } from '@contember/schema'
import { PermissionFactory } from '../../../src/acl'
import { SchemaBuilder } from '@contember/schema-definition'
import * as assert from 'uvu/assert'
import { suite } from 'uvu'

interface Test {
	acl: Acl.Schema
	roles: string[]
	result: Acl.Permissions
}

const execute = (test: Test) => {
	const schema: Model.Schema = new SchemaBuilder()
		.entity('Entity1', e => e.column('lorem').column('bar'))
		.entity('Entity2', e => e.oneHasOne('xyz', r => r.target('Entity1')))
		.buildSchema()
	const merger = new PermissionFactory(schema)
	const result = merger.create(test.acl, test.roles)
	assert.equal(result, test.result)
}

const permissionMergerTest = suite('Permission merger')
permissionMergerTest

permissionMergerTest('merge inheritance', () => {
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

permissionMergerTest('merge entity operations', () => {
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

permissionMergerTest('merge entity operations with predicates', () => {
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

permissionMergerTest('merge entity operations and drops predicate', () => {
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

permissionMergerTest('merge entity operations and merges predicates', () => {
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

permissionMergerTest('merge delete operation', () => {
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

permissionMergerTest('merge predicates and resolves conflicts', () => {
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

permissionMergerTest('make primary predicate union of all other fields', () => {
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

permissionMergerTest('prefix variables', () => {
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

permissionMergerTest('prefix inherited variables', () => {
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

permissionMergerTest.run()
