import { ApiTester, createCreateEvent, createRunMigrationEvent, GQL } from '@contember/engine-api-tester'
import { Migration, VERSION_LATEST } from '@contember/schema-migrations'
import { createMigrationResolver } from '@contember/engine-api-tester'
import { ProjectConfig, StageConfig } from '../../../../src'
import { suite } from 'uvu'
import * as assert from '../../../src/asserts'
import { Logger } from '@contember/engine-common'

const projectInitializerTest = suite('Project initializer')
const nullLogger = new Logger(() => {})

projectInitializerTest('create preview stage', async () => {
	const prodStage: StageConfig = {
		name: 'Prod',
		slug: 'prod',
	}
	const project: ProjectConfig = {
		slug: 'example-project',
		stages: [prodStage],
	}

	const tester = await ApiTester.create({
		project: {
			stages: [prodStage],
		},
	})

	await tester.systemContainer.projectInitializer.initialize(tester.databaseContextFactory, project, nullLogger)
	const createdStagesA = await tester.stages.refreshCreatedStages()
	assert.contains(createdStagesA, 'prod')
	assert.not.contains(createdStagesA, 'preview')

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

	const project2: ProjectConfig = {
		slug: 'example-project',
		stages: [
			prodStage,
			{
				name: 'Preview',
				slug: 'preview',
				base: 'prod',
			},
		],
	}

	await tester.systemContainer.projectInitializer.initialize(tester.databaseContextFactory, project2, nullLogger)
	await tester.stages.refreshCreatedStages()

	const createdStagesB = await tester.stages.refreshCreatedStages()
	assert.contains(createdStagesB, 'prod')
	assert.contains(createdStagesB, 'preview')

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
})

projectInitializerTest('create second preview stage', async () => {
	const prodStage: StageConfig = {
		name: 'Prod',
		slug: 'prod',
	}
	const previewStage: StageConfig = {
		name: 'Preview',
		slug: 'preview',
		base: 'prod',
	}
	const preview2Stage: StageConfig = {
		name: 'Preview 2',
		slug: 'preview2',
		base: 'preview',
	}

	const config1: ProjectConfig = {
		slug: 'example-project',
		stages: [prodStage, previewStage],
	}

	const tester = await ApiTester.create({
		project: config1,
	})

	await tester.systemContainer.projectInitializer.initialize(tester.databaseContextFactory, config1, nullLogger)
	const createdStagesA = await tester.stages.refreshCreatedStages()

	assert.contains(createdStagesA, 'prod')
	assert.contains(createdStagesA, 'preview')
	assert.not.contains(createdStagesA, 'preview2')

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

	const config2: ProjectConfig = {
		slug: 'test',
		stages: [prodStage, previewStage, preview2Stage],
	}

	await tester.systemContainer.projectInitializer.initialize(tester.databaseContextFactory, config2, nullLogger)

	await tester.stages.refreshCreatedStages()

	const createdStagesB = await tester.stages.refreshCreatedStages()
	assert.contains(createdStagesB, 'prod')
	assert.contains(createdStagesB, 'preview')
	assert.contains(createdStagesB, 'preview2')

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
})

projectInitializerTest('migrate stages with rebase', async () => {
	const prodStage: StageConfig = {
		name: 'Prod',
		slug: 'prod',
	}
	const previewStage: StageConfig = {
		name: 'Preview',
		slug: 'preview',
		base: 'prod',
	}

	const project: ProjectConfig = {
		slug: 'example-project',
		stages: [prodStage, previewStage],
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

	const migrationsResolver = createMigrationResolver(migrations)

	const tester = await ApiTester.create({
		project: {
			stages: [prodStage, previewStage],
		},
		migrationsResolver,
	})

	await tester.systemContainer.projectInitializer.initialize(tester.databaseContextFactory, project, nullLogger)
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

	await tester.systemContainer.projectInitializer.initialize(tester.databaseContextFactory, project, nullLogger)
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
})

projectInitializerTest.run()
