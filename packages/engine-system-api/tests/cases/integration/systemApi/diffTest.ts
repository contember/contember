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

			const response = await tester.content.queryContent(
				'preview',
				GQL`mutation {
          createAuthor(data: {name: "John Doe"}) {
              node {
                  id
              }
          }
      }`,
			)

			await tester.content.queryContent(
				'preview',
				GQL`mutation {
          createAuthor(data: {name: "Jack Black"}) {
              ok
          }
      }`,
			)

			const diff = await tester.system.querySystem(GQL`query {
			diff(baseStage: "prod", headStage: "preview", filter: [{entity: "Author", id: "${response.createAuthor.node.id}"}]) {
				result {
					events {
						id
						dependencies
						description
						allowed
						type
					}
				}
			}
		}`)

			expect(diff.data.diff.result.events.length).toBe(1)
			expect(diff.data.diff.result.events[0].type).toBe('CREATE')
			await tester.cleanup()
		},
		TIMEOUT,
	)

	it(
		'diff permissions - cannot write',
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

			await tester.content.queryContent(
				'preview',
				GQL`mutation {
          createAuthor(data: {name: "John Doe"}) {
              ok
          }
      }`,
			)

			const diff = await tester.system.querySystem(
				GQL`query {
        diff(baseStage: "prod", headStage: "preview") {
          result {
            events {
              id
              dependencies
              description
              allowed
              type
            }
          }
        }
      }`,
				{},
				{
					roles: [],
					projectRoles: ['viewer'],
				},
			)

			expect(diff.data.diff.result.events.length).toBe(1)
			expect(diff.data.diff.result.events[0].type).toBe('CREATE')
			expect(diff.data.diff.result.events[0].allowed).toBe(false)
			await tester.cleanup()
		},
		TIMEOUT,
	)
})
