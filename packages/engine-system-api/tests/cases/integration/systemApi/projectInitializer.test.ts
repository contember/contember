import { ApiTester } from '@contember/engine-api-tester'
import { ProjectConfig, StageConfig } from '../../../../src'
import { assert, test } from 'vitest'
import { createLogger } from '@contember/engine-common'


const nullLogger = createLogger()

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

	await tester.systemContainer.projectInitializer.initialize(tester.databaseContextFactory, project, nullLogger)
	const createdStagesA = await tester.stages.refreshCreatedStages()
	assert.ok(createdStagesA.has('prod'))

	await tester.cleanup()
})

