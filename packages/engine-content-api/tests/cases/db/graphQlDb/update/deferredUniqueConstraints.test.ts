import { test } from 'vitest'
import { c, createSchema } from '@contember/schema-definition'
import { GQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'
import { executeDbTest } from '@contember/engine-api-tester'

namespace DeferredUniqueModel {
	export class Post {
		slug = c.stringColumn().unique()
		order = c.intColumn().unique({ timing: 'deferrable' })
	}
}

test('update without deferring unique constraints', async () => {
	await executeDbTest({
		schema: createSchema(DeferredUniqueModel),
		seed: [
			{
				query: `mutation {
					postA: createPost(data: {slug: "a", order: 1}) {
						ok
						node {
							id
						}
					}
					postB: createPost(data: {slug: "b", order: 2}) {
						ok
						node {
							id
						}
					}
				}`,
			},
		],
		query: GQL`
			mutation {
				transaction {
					ok
					errorMessage
					upA: updatePost(by: {slug: "a"}, data: {order: 2}) {
						ok
						errorMessage
					}
					upB: updatePost(by: {slug: "b"}, data: {order: 1}) {
						ok
						errorMessage
					}
				}
			}
		`,
		return: {
			transaction: {
				ok: false,
				errorMessage: 'Execution has failed:\nupA.order: UniqueConstraintViolation (Value (2) already exists in unique columns (order) on entity Post)',
				upA: {
					ok: false,
					errorMessage: 'Execution has failed:\norder: UniqueConstraintViolation (Value (2) already exists in unique columns (order) on entity Post)',
				},
				upB: {
					ok: false,
					errorMessage: null,
				},
			},
		},
	})
})

test('update with deferring unique constraints', async () => {
	await executeDbTest({
		schema: createSchema(DeferredUniqueModel),
		seed: [
			{
				query: `mutation {
				
					postA: createPost(data: {slug: "a", order: 1}) {
						ok
						node {
							id
						}
					}
					postB: createPost(data: {slug: "b", order: 2}) {
						ok
						node {
							id
						}
					}
				}`,
			},
		],
		query: GQL`
			mutation {
				transaction(options: {deferUniqueConstraints: true}) {
					ok
					errorMessage
					upA: updatePost(by: {slug: "a"}, data: {order: 2}) {
						ok
						errorMessage
					}
					upB: updatePost(by: {slug: "b"}, data: {order: 1}) {
						ok
						errorMessage
					}
				}
			}
		`,
		return: {
			transaction: {
				ok: true,
				errorMessage: null,
				upA: {
					ok: true,
					errorMessage: null,
				},
				upB: {
					ok: true,
					errorMessage: null,
				},
			},
		},
	})
})


test('update with failed deferred unique constraints', async () => {
	await executeDbTest({
		schema: createSchema(DeferredUniqueModel),
		seed: [
			{
				query: `mutation {
				
					postA: createPost(data: {slug: "a", order: 1}) {
						ok
						node {
							id
						}
					}
					postB: createPost(data: {slug: "b", order: 2}) {
						ok
						node {
							id
						}
					}
				}`,
			},
		],
		query: GQL`
			mutation {
				transaction(options: {deferUniqueConstraints: true}) {
					ok
					errorMessage
					upA: updatePost(by: {slug: "a"}, data: {order: 2}) {
						ok
						errorMessage
					}
				}
			}
		`,
		return: {
			transaction: {
				ok: false,
				errorMessage: 'Execution has failed:\norder: UniqueConstraintViolation (Value (2) already exists in unique columns (order) on entity Post)',
				upA: {
					ok: true,
					errorMessage: null,
				},
			},
		},
	})
})
