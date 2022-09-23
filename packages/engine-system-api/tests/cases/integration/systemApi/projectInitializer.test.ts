import { ApiTester } from '@contember/engine-api-tester'
import { ProjectConfig, StageConfig } from '../../../../src'
import { assert, test } from 'vitest'
import { createLogger, JsonStreamLoggerHandler } from '@contember/logger'


const logger = createLogger(new JsonStreamLoggerHandler(process.stderr))

test('create stage', async () => {
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

	await tester.systemContainer.projectInitializer.initialize(tester.databaseContextFactory, project, logger)
	const createdStagesA = await tester.stages.refreshCreatedStages()
	assert.ok(createdStagesA.has('prod'))

	await tester.cleanup()
})

