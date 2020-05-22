import 'jasmine'
import { ApiTester, GQL } from '@contember/engine-api-tester'
import { TIMEOUT } from '../../../src/constants'

describe('system api - history', () => {
	it(
		'returns filtered history',
		async () => {
			const tester = await ApiTester.create({
				project: {
					stages: [
						{
							name: 'Prod',
							slug: 'prod',
						},
					],
				},
			})
			await tester.stages.createAll()
			await tester.stages.migrate('2019-02-01-163923')

			const response = await tester.content.queryContent(
				'prod',
				GQL`mutation {
          createAuthor(data: {name: "John Doe"}) {
              node {
                  id
              }
          }
      }`,
			)

			await tester.content.queryContent(
				'prod',
				GQL`mutation {
          updateAuthor(data: {name: "John The Doe"}, by: {id: "${response.createAuthor.node.id}"}) {
              node {
                  id
              }
          }
      }`,
			)

			await tester.content.queryContent(
				'prod',
				GQL`mutation {
          createAuthor(data: {name: "Jack Black"}) {
              ok
          }
      }`,
			)

			const history = await tester.system.querySystem(GQL`query {
			history(stage: "prod", filter: [{entity: "Author", id: "${response.createAuthor.node.id}"}]) {
				result {
					events {
						id
						description
						type
						identityDescription
					}
				}
			}
		}`)

			expect(history.data.history.result.events.length).toBe(2)
			expect(history.data.history.result.events[0].type).toBe('CREATE')
			expect(history.data.history.result.events[1].type).toBe('UPDATE')

			await tester.cleanup()
		},
		TIMEOUT,
	)
})
