import { SchemaDefinition as def } from '@contember/schema-definition'
import { GQL } from '../../../../src/tags'
import { test } from 'vitest'
import { executeDbTest } from '@contember/engine-api-tester'

namespace SeqModel {
	export class Order {
		seqId = def.intColumn().sequence().notNull()
	}
}

test('insert author with id', async () => {
	const model = def.createModel(SeqModel)
	await executeDbTest({
		schema: { model },
		query: GQL`
          mutation {
              createOrder(data: {}) {
                  node {
                  	seqId
                  }
              }
          }`,
		seed: [],
		return: {
			createOrder: {
				node: {
					seqId: 1,
				},
			},
		},
	})
})

