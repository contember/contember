import 'mocha'
import { testUuid } from '../../../src/testUuid'
import ApiTester from '../../../src/ApiTester'
import { GQL } from '../../../src/tags'
import { expect } from 'chai'

describe('system api - diff', () => {
	it('returns filtered diff', async () => {
		const tester = await ApiTester.create({
			project: {
				stages: [
					{
						id: testUuid(2),
						name: 'Prod',
						slug: 'prod',
					},
					{
						id: testUuid(1),
						name: 'Preview',
						slug: 'preview',
						rebaseOn: 'prod',
					},
				],
			},
		})
		await tester.stages.createAll()
		await tester.stages.migrate('2019-02-01-163923-init')

		const response = await tester.content.queryContent(
			'preview',
			GQL`mutation {
        createAuthor(data: {name: "John Doe"}) {
          id
        }
      }`
		)

		await tester.content.queryContent(
			'preview',
			GQL`mutation {
        createAuthor(data: {name: "Jack Black"}) {
          id
        }
      }`
		)

		const diff = await tester.system.querySystem(GQL`query {
			diff(baseStage: "prod", headStage: "preview", filter: [{entity: "Author", id: "${response.createAuthor.id}"}]) {
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

		expect(diff.data.diff.result.events).length(1)
		expect(diff.data.diff.result.events[0].type).eq('CREATE')
	})

	it('diff permissions - cannot write', async () => {
		const tester = await ApiTester.create({
			project: {
				stages: [
					{
						id: testUuid(2),
						name: 'Prod',
						slug: 'prod',
					},
					{
						id: testUuid(1),
						name: 'Preview',
						slug: 'preview',
						rebaseOn: 'prod',
					},
				],
			},
		})
		await tester.stages.createAll()

		await tester.stages.migrate('2019-02-01-163923-init')

		await tester.content.queryContent(
			'preview',
			GQL`mutation {
        createAuthor(data: {name: "John Doe"}) {
          id
        }
      }`
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
			}
		)

		expect(diff.data.diff.result.events).length(1)
		expect(diff.data.diff.result.events[0].type).eq('CREATE')
		expect(diff.data.diff.result.events[0].allowed).eq(false)
	})
})
