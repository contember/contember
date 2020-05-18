import 'jasmine'
import { ApiTester, GQL } from '@contember/engine-api-tester'
import { TIMEOUT } from '../../../src/constants'

describe('system api - diff', () => {
	it(
		'returns filtered diff',
		async () => {
			const tester = await ApiTester.create({
				project: {
					stages: [
						{
							name: 'Prod',
							slug: 'prod',
						},
						{
							name: 'Preview',
							slug: 'preview',
							base: 'prod',
						},
					],
				},
			})
			await tester.stages.createAll()
			await tester.stages.migrate('2019-02-01-163923')
			await tester.stages.migrate('2019-11-04-130244')

			const response = await tester.content.queryContent(
				'preview',
				GQL`mutation {
          createAuthor(data: {name: "John Doe", contact: {create: {email: "john@example.org"}}}) {
              node {
                  id
              }
          }
      }`,
			)

			await tester.content.queryContent(
				'preview',
				GQL`mutation($author: UUID!) {
				createPost(data: {title: "abc", content: "xyz", author: {connect: {id: $author}}}) {
					ok
				}
			}`,
				{ author: response.createAuthor.node.id },
			)

			await tester.content.queryContent(
				'preview',
				GQL`mutation {
          createAuthor(data: {name: "Jack Black", contact: {create: {email: "jack@example.org"}}}) {
              ok
          }
      }`,
			)

			const diff = await tester.system.querySystem(GQL`query {
			diff(stage: "preview", filter: [{entity: "Author", id: "${response.createAuthor.node.id}"}]) {
				result {
					events {
						id
						dependencies
						description
						type
					}
				}
			}
		}`)

			expect(diff.data.diff.result.events.length).toBe(2)
			expect(diff.data.diff.result.events[0].type).toBe('CREATE')

			const diffWithRelations = await tester.system.querySystem(GQL`query {
			diff(stage: "preview", filter: [{entity: "Author", id: "${response.createAuthor.node.id}", relations: [{name: "posts", relations: []}]}]) {
				result {
					events {
						id
						dependencies
						description
						type
					}
				}
			}
		}`)

			expect(diffWithRelations.data.diff.result.events.length).toBe(3)
			expect(diffWithRelations.data.diff.result.events[0].type).toBe('CREATE')
			await tester.cleanup()
		},
		TIMEOUT,
	)
})
