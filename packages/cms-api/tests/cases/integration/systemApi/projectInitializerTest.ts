import 'mocha'
import ApiTester from '../../../src/ApiTester'
import { GQL } from '../../../src/tags'
import { createCreateEvent, createRunMigrationEvent } from '../../../src/DummyEventFactory'
import { testUuid } from '../../../src/testUuid'
import { createMock } from '../../../../src/utils/testing'
import StageTree from '../../../../src/system-api/model/stages/StageTree'
import { StageWithoutEvent } from '../../../../src/system-api/model/dtos/Stage'
import { expect } from 'chai'
import MigrationsResolver from '../../../../src/content-schema/MigrationsResolver'
import Migration from '../../../../src/system-api/model/migrations/Migration'

describe('project initializer', () => {
	it('create preview stage', async () => {
		const prodStage: StageWithoutEvent = {
			id: testUuid(1),
			name: 'Prod',
			slug: 'prod',
		}
		const stages: Record<string, StageWithoutEvent[]> = {}

		const stageTree = createMock<StageTree>({
			getRoot(): StageWithoutEvent {
				return prodStage
			},
			getChildren(stage: StageWithoutEvent): StageWithoutEvent[] {
				return stages[stage.slug] || []
			},
		})

		const tester = await ApiTester.create({
			project: {
				stages: [prodStage],
			},
			systemExecutionContainerHook: container => {
				return container.replaceService('stageTree', () => stageTree)
			},
		})

		await tester.systemExecutionContainer.projectIntializer.initialize()
		const createdStagesA = await tester.stages.refreshCreatedStages()
		expect(createdStagesA).contains('prod')
		expect(createdStagesA).not.contains('preview')

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

		stages['prod'] = [
			{
				id: testUuid(2),
				name: 'Preview',
				slug: 'preview',
			},
		]

		await tester.systemExecutionContainer.projectIntializer.initialize()
		await tester.stages.refreshCreatedStages()

		const createdStagesB = await tester.stages.refreshCreatedStages()
		expect(createdStagesB).contains('prod')
		expect(createdStagesB).contains('preview')

		await tester.sequences.verifySequence(
			{
				prod: '        1 2',
				preview: 'prod - -',
			},
			{
				1: createRunMigrationEvent('2019-02-01-163923'),
				2: createCreateEvent(response.createAuthor.node.id, 'author', { name: 'John Doe' }),
			},
		)
	})

	it('creates second preview stage', async () => {
		const prodStage: StageWithoutEvent = {
			id: testUuid(1),
			name: 'Prod',
			slug: 'prod',
		}
		const previewStage: StageWithoutEvent = {
			id: testUuid(2),
			name: 'Preview',
			slug: 'preview',
		}
		const preview2Stage: StageWithoutEvent = {
			id: testUuid(3),
			name: 'Preview 2',
			slug: 'preview2',
		}

		const stages: Record<string, StageWithoutEvent[]> = {
			prod: [previewStage],
		}

		const stageTree = createMock<StageTree>({
			getRoot(): StageWithoutEvent {
				return prodStage
			},
			getChildren(stage: StageWithoutEvent): StageWithoutEvent[] {
				return stages[stage.slug] || []
			},
		})

		const tester = await ApiTester.create({
			project: {
				stages: [prodStage, previewStage],
			},
			systemExecutionContainerHook: container => {
				return container.replaceService('stageTree', () => stageTree)
			},
		})

		await tester.systemExecutionContainer.projectIntializer.initialize()
		const createdStagesA = await tester.stages.refreshCreatedStages()

		expect(createdStagesA).contains('prod')
		expect(createdStagesA).contains('preview')
		expect(createdStagesA).not.contains('preview2')

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

		const response2 = await tester.content.queryContent(
			'preview',
			GQL`mutation {
          createAuthor(data: {name: "Jack Black"}) {
              node {
                  id
              }
          }
      }`,
		)

		await tester.sequences.verifySequence(
			{
				prod: '        1 2',
				preview: 'prod - 3',
			},
			{
				1: createRunMigrationEvent('2019-02-01-163923'),
				2: createCreateEvent(response.createAuthor.node.id, 'author', { name: 'John Doe' }),
				3: createCreateEvent(response2.createAuthor.node.id, 'author', { name: 'Jack Black' }),
			},
		)

		stages['preview'] = [preview2Stage]

		await tester.systemExecutionContainer.projectIntializer.initialize()

		await tester.stages.refreshCreatedStages()

		const createdStagesB = await tester.stages.refreshCreatedStages()
		expect(createdStagesB).contains('prod')
		expect(createdStagesB).contains('preview')
		expect(createdStagesB).contains('preview2')

		await tester.sequences.verifySequence(
			{
				prod: '            1 2',
				preview: 'prod     - 3',
				preview2: 'preview - -',
			},
			{
				1: createRunMigrationEvent('2019-02-01-163923'),
				2: createCreateEvent(response.createAuthor.node.id, 'author', { name: 'John Doe' }),
				3: createCreateEvent(response2.createAuthor.node.id, 'author', { name: 'Jack Black' }),
			},
		)
	})

	it('migrate stages with rebase', async () => {
		const prodStage: StageWithoutEvent = {
			id: testUuid(1),
			name: 'Prod',
			slug: 'prod',
		}
		const previewStage: StageWithoutEvent = {
			id: testUuid(2),
			name: 'Preview',
			slug: 'preview',
		}

		const stages: Record<string, StageWithoutEvent[]> = {
			prod: [previewStage],
		}

		const migrations: Migration[] = [
			{
				version: '2019-04-17-123500',
				modifications: [
					{
						modification: 'createEntity',
						entity: {
							name: 'Author',
							primary: 'id',
							primaryColumn: 'id',
							tableName: 'author',
							fields: {
								id: {
									name: 'id',
									columnName: 'id',
									nullable: false,
									type: 'Uuid',
									columnType: 'uuid',
								},
							},
							unique: {},
						},
					},
					{
						modification: 'createColumn',
						entityName: 'Author',
						field: {
							name: 'name',
							columnName: 'name',
							nullable: true,
							type: 'String',
							columnType: 'text',
						},
					},
				],
			},
		]

		const stageTree = createMock<StageTree>({
			getRoot(): StageWithoutEvent {
				return prodStage
			},
			getChildren(stage: StageWithoutEvent): StageWithoutEvent[] {
				return stages[stage.slug] || []
			},
		})

		const migrationsResolver = createMock<MigrationsResolver>({
			getMigrations(): Promise<Migration[]> {
				return Promise.resolve(migrations)
			},
		})

		const tester = await ApiTester.create({
			project: {
				stages: [prodStage, previewStage],
			},
			migrationsResolver,
			systemExecutionContainerHook: container => {
				return container.replaceService('stageTree', () => stageTree)
			},
		})

		await tester.systemExecutionContainer.projectIntializer.initialize()
		await tester.stages.refreshCreatedStages()

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

		const response2 = await tester.content.queryContent(
			'preview',
			GQL`mutation {
          createAuthor(data: {name: "Jack Black"}) {
              node {
                  id
              }
          }
      }`,
		)

		migrations.push({
			version: '2019-04-17-123600',
			modifications: [
				{
					modification: 'updateColumnName',
					entityName: 'Author',
					fieldName: 'name',
					columnName: 'fullName',
				},
			],
		})

		await tester.systemExecutionContainer.projectIntializer.initialize()
		await tester.stages.refreshCreatedStages()

		await tester.sequences.verifySequence(
			{
				prod: '        1 2 3',
				preview: 'prod - - - 4',
			},
			{
				1: createRunMigrationEvent('2019-04-17-123500'),
				2: createCreateEvent(response.createAuthor.node.id, 'author', { name: 'John Doe' }),
				3: createRunMigrationEvent('2019-04-17-123600'),
				4: createCreateEvent(response2.createAuthor.node.id, 'author', { fullName: 'Jack Black' }),
			},
		)
	})
})
