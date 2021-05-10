import { ApiTester } from '@contember/engine-api-tester'
import { ProjectConfig, StageConfig } from '../../../../src'
import { suite } from 'uvu'
import * as assert from '../../../src/asserts'
import { Logger } from '@contember/engine-common'

const projectInitializerTest = suite('Project initializer')
const nullLogger = new Logger(() => {})

projectInitializerTest('create stage', async () => {
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

	await tester.cleanup()
})

projectInitializerTest.run()
