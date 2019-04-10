import 'mocha'
import { testUuid } from '../../../src/testUuid'
import { ApiTester } from '../../../src/ApiTester'
import { GQL } from '../../../src/tags'
import EventSequence from '../../../src/EventSequence'
import { expect } from 'chai'

describe('system api - release', () => {
	it('executes release', async () => {
		const eventsSequence = {
			a: '  1 2 3 4 5',
			b: 'a - - - - 6 7',
			c: 'b - - - - - -',
			d: 'b - - - - - 8',
			e: 'd - - - - - - 9',
			f: 'a - - - - 10 11',
			g: 'd - - - - -',
		}
		const tester = await ApiTester.create({
			project: {
				stages: EventSequence.createStagesConfiguration(eventsSequence)
			}
		})


		let i = 0
		for (const stage in eventsSequence) {
			await tester.createStage({
				uuid: testUuid(++i),
				name: stage,
				slug: stage,
			})
			if (i === 1) {
				await tester.migrateStage(stage, '2019-02-01-163923-init')
			} else {
				await tester.releaseForward(stage, 'a', 1)
			}
		}
		await tester.refreshStagesVersion()
		await tester.runSequence(eventsSequence)

		const result = await tester.querySystem(GQL`mutation {
      rebaseAll {
        ok
      }
    }`)
		expect(result.data.rebaseAll.ok).eq(true)

		await tester.verifySequence({
			a: '  1 2 3 4 5',
			b: 'a - - - - - 6 7',
			c: 'b - - - - - - -',
			d: 'b - - - - - - - 8',
			e: 'd - - - - - - - - 9',
			f: 'a - - - - - 10 11',
			g: 'd - - - - - - - -',
		}, 1)

	})
})
