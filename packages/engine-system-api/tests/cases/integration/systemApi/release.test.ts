import { ApiTester, createRunMigrationEvent, EventSequence, GQL } from '@contember/engine-api-tester'
import { DiffEventType } from '../../../../src/schema'
import { Acl } from '@contember/schema'
import { VERSION_LATEST } from '@contember/schema-migrations'
import { suite } from 'uvu'
import * as assert from '../../../src/asserts'
import SystemPermissionsLevel = Acl.SystemPermissionsLevel

const releaseTest = suite('System API - release')

releaseTest('execute release', async () => {
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

	await tester.stages.migrate('2019-02-01-163923-init')

	await tester.content.queryContent(
		'preview',
		GQL`mutation {
				createAuthor(data: {name: "John Doe"}) {
					ok
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

	const diff = await tester.system.diff('preview')

	assert.is(diff.events.length, 2)
	assert.is(diff.events[0].type, 'CREATE')
	assert.is(diff.events[1].type, 'CREATE')

	const result = await tester.system.querySystem(
		GQL`mutation ($stage: String!, $events: [String!]!) {
				release(stage: $stage, events: $events) {
					ok
				}
			}`,
		{
			stage: 'preview',
			events: [diff.events[1].id],
		},
	)

	assert.ok(result.data.release.ok)

	const authors = await tester.content.queryContent(
		'prod',
		GQL`query {
				listAuthor {
					name
				}
			}`,
	)

	assert.equal(authors, {
		listAuthor: [{ name: 'Jack Black' }],
	})

	const diff2 = await tester.system.diff('preview')

	assert.is(diff2.events.length, 1)
	assert.is(diff2.events[0].type, DiffEventType.Create)
	await tester.cleanup()
})

releaseTest('execute rebase after release', async () => {
	const eventsSequence = {
		a: '  1 2 3',
		b: 'a - - - 4 5',
		c: 'b - - - - - 6',
		d: 'b - - - - - 7',
		e: 'd - - - - - 8',
	}

	const stages = EventSequence.createStagesConfiguration(eventsSequence)
	const tester = await ApiTester.create({
		project: {
			stages: stages,
		},
	})
	await tester.stages.createAll()

	await tester.stages.migrate('2019-02-01-163923-init')

	await tester.sequences.runSequence(eventsSequence)

	const diff = await tester.system.diff('b')

	assert.is(diff.events.length, 2)
	assert.is(diff.events[0].type, 'CREATE')

	const result = await tester.system.querySystem(
		GQL`mutation ($stage: String!, $events: [String!]!) {
				release(stage: $stage, events: $events) {
					ok
				}
			}`,
		{
			stage: 'b',
			events: [diff.events[1].id],
		},
	)

	await tester.sequences.verifySequence(
		{
			a: '  99 1 2 3 5',
			b: 'a -  - - - - 4',
			c: 'b -  - - - - - 6',
			d: 'b -  - - - - - 7',
			e: 'd -  - - - - - - 8',
		},
		{
			99: createRunMigrationEvent('2019-02-01-163923'),
		},
	)
	await tester.cleanup()
})

releaseTest('test ACL rules', async () => {
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
	await tester.stages.migrate({
		formatVersion: VERSION_LATEST,
		name: 'acl',
		version: '2020-02-01-163923',
		modifications: [
			{
				modification: 'patchAclSchema',
				patch: [
					{
						op: 'add',
						path: '/roles/none',
						value: {
							variables: {},
							stages: '*',
							entities: {},
							system: {
								release: SystemPermissionsLevel.none,
							},
						},
					},
					{
						op: 'add',
						path: '/roles/some',
						value: {
							variables: {},
							stages: '*',
							entities: {
								Author: {
									predicates: {},
									operations: {
										create: {
											name: true,
										},
										read: {
											name: true,
										},
									},
								},
							},
							system: {
								release: SystemPermissionsLevel.some,
							},
						},
					},
				],
			},
		],
	})

	await tester.content.queryContent(
		'preview',
		GQL`mutation {
					createAuthor(data: {name: "John Doe"}) {
						node {
							id
						}
					}
				}`,
	)

	const diff = await tester.system.diff('preview')

	assert.is(diff.events.length, 1)
	assert.is(diff.events[0].type, 'CREATE')

	const gql = GQL`mutation ($stage: String!, $events: [String!]!) {
			release(stage: $stage, events: $events) {
				ok
				errors
			}
		}`
	const variables = {
		stage: 'preview',
		events: [diff.events[0].id],
	}

	const result = await tester.system.querySystem(gql, variables, { roles: ['some'] })
	console.log(result.data.release.errors)

	assert.ok(result.data.release.ok)

	await assert.throwsAsync(
		tester.system.querySystem(gql, variables, { roles: ['none'] }),
		/You are not allowed to execute a release.+/,
	)

	await tester.cleanup()
})

releaseTest.run()
