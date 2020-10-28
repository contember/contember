import { ApiTester, createRunMigrationEvent, EventSequence, GQL } from '@contember/engine-api-tester'
import { suite } from 'uvu'
import * as assert from 'uvu/assert'

const rebaseTest = suite('System API - rebase')
rebaseTest('executes rebase', async () => {
	const eventsSequence = {
		a: '  1 2 3 4 5',
		b: 'a - - - - 6 7',
		c: 'b - - - - - -',
		d: 'b - - - - - 8',
		e: 'd - - - - - - 9',
		f: 'a - - - - 10 11',
		g: 'd - - - - -',
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

	const result = await tester.system.querySystem(GQL`mutation {
      rebaseAll {
        ok
      }
    }`)
	assert.ok(result.data.rebaseAll.ok)

	await tester.sequences.verifySequence(
		{
			a: '  99 1 2 3 4 5',
			b: 'a -  - - - - - 6 7',
			c: 'b -  - - - - - - -',
			d: 'b -  - - - - - - - 8',
			e: 'd -  - - - - - - - - 9',
			f: 'a -  - - - - - 10 11',
			g: 'd -  - - - - - - - -',
		},
		{
			99: createRunMigrationEvent('2019-02-01-163923'),
		},
	)
	await tester.cleanup()
})
rebaseTest.run()
