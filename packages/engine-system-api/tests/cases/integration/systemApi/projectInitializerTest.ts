import 'jasmine'
import { ApiTester, createCreateEvent, createRunMigrationEvent, GQL } from '@contember/engine-api-tester'
import { createMock } from '../../../src/utils'
import StageTree from '../../../../src/model/stages/StageTree'
import { StageWithoutEvent } from '../../../../src/model/dtos/Stage'
import { Migration, VERSION_LATEST } from '@contember/schema-migrations'
import { createMigrationResolver } from '@contember/engine-api-tester/dist/src/migrationResolver'
import { TIMEOUT } from '../../../src/constants'

describe('project initializer', () => {
	it(
		'create preview stage',
		async () => {
			const prodStage: StageWithoutEvent = {
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
			expect(createdStagesA).toContain('prod')
			expect(createdStagesA).not.toContain('preview')

			const response = await tester.content.queryContent(
				'prod',
				GQL`mutation {
        createTag(data: {label: "graphql"}) {
          node {
            id
          }
        }
      }`,
			)

			stages['prod'] = [
				{
					name: 'Preview',
					slug: 'preview',
				},
			]

			await tester.systemExecutionContainer.projectIntializer.initialize()
			await tester.stages.refreshCreatedStages()

			const createdStagesB = await tester.stages.refreshCreatedStages()
			expect(createdStagesB).toContain('prod')
			expect(createdStagesB).toContain('preview')

			await tester.sequences.verifySequence(
				{
					prod: '        1 2',
					preview: 'prod - -',
				},
				{
					1: createRunMigrationEvent('2019-02-01-163923'),
					2: createRunMigrationEvent('2019-11-04-130244'),
					3: createCreateEvent(response.createTag.node.id, 'tag', { label: 'graphql' }),
				},
			)
			await tester.cleanup()
		},
		TIMEOUT,
	)

	it(
		'creates second preview stage',
		async () => {
			const prodStage: StageWithoutEvent = {
				name: 'Prod',
				slug: 'prod',
			}
			const previewStage: StageWithoutEvent = {
				name: 'Preview',
				slug: 'preview',
			}
			const preview2Stage: StageWithoutEvent = {
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

			expect(createdStagesA).toContain('prod')
			expect(createdStagesA).toContain('preview')
			expect(createdStagesA).not.toContain('preview2')

			const response = await tester.content.queryContent(
				'prod',
				GQL`mutation {
        createTag(data: {label: "graphql"}) {
          node {
            id
          }
        }
      }`,
			)

			const response2 = await tester.content.queryContent(
				'preview',
				GQL`mutation {
        createTag(data: {label: "typescript"}) {
          node {
            id
          }
        }
      }`,
			)

			await tester.sequences.verifySequence(
				{
					prod: '        1 2 3',
					preview: 'prod - - 4',
				},
				{
					1: createRunMigrationEvent('2019-02-01-163923'),
					2: createRunMigrationEvent('2019-11-04-130244'),
					3: createCreateEvent(response.createTag.node.id, 'tag', { label: 'graphql' }),
					4: createCreateEvent(response2.createTag.node.id, 'tag', { label: 'typescript' }),
				},
			)

			stages['preview'] = [preview2Stage]

			await tester.systemExecutionContainer.projectIntializer.initialize()

			await tester.stages.refreshCreatedStages()

			const createdStagesB = await tester.stages.refreshCreatedStages()
			expect(createdStagesB).toContain('prod')
			expect(createdStagesB).toContain('preview')
			expect(createdStagesB).toContain('preview2')

			await tester.sequences.verifySequence(
				{
					prod: '            1 2 3',
					preview: 'prod     - - 4',
					preview2: 'preview - - -',
				},
				{
					1: createRunMigrationEvent('2019-02-01-163923'),
					2: createRunMigrationEvent('2019-11-04-130244'),
					3: createCreateEvent(response.createTag.node.id, 'tag', { label: 'graphql' }),
					4: createCreateEvent(response2.createTag.node.id, 'tag', { label: 'typescript' }),
				},
			)
			await tester.cleanup()
		},
		TIMEOUT,
	)

	it(
		'migrate stages with rebase',
		async () => {
			const prodStage: StageWithoutEvent = {
				name: 'Prod',
				slug: 'prod',
			}
			const previewStage: StageWithoutEvent = {
				name: 'Preview',
				slug: 'preview',
			}

			const stages: Record<string, StageWithoutEvent[]> = {
				prod: [previewStage],
			}

			const migrations: Migration[] = [
				{
					formatVersion: VERSION_LATEST,
					version: '2019-04-17-123500',
					name: '2019-04-17-123500-foo',
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

			const migrationsResolver = createMigrationResolver(migrations)

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
				formatVersion: VERSION_LATEST,
				version: '2019-04-17-123600',
				name: '2019-04-17-123600-foo',
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
			await tester.cleanup()
		},
		TIMEOUT,
	)
})
