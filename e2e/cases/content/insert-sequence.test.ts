import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { test } from 'vitest'
import { createTester, gql } from '../../src/tester'

namespace SeqModel {
	export class Order {
		seqId = def.intColumn().sequence().notNull()
	}
}

test('insert author with id', async () => {
	const tester = await createTester(createSchema(SeqModel))

	await tester(gql`
          mutation {
              createOrder(data: {}) {
                  node {
                  	seqId
                  }
              }
          }`)
		.expect(200)
		.expect({
			data: {
				createOrder: {
					node: {
						seqId: 1,
					},
				},
			},
		})
})

