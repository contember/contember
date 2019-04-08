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

		// const expected = {
		// 	a: '  1 2 3 4 5',
		// 	b: 'a - - - - - 6 7',
		// 	c: 'b - - - - - - - ',
		// 	d: 'b - - - - - - - 9',
		// 	e: 'd - - - - - - - - 12',
		// 	f: 'a - - - - - 10 11',
		// }

		const abDiff = await tester.diff('a', 'b')
		expect(abDiff.events).length(2)

		const bcDiff = await tester.diff('b', 'c')
		expect(bcDiff.events).length(0)

		const bdDiff = await tester.diff('b', 'd')
		expect(bdDiff.events).length(1)

		const deDiff = await tester.diff('d', 'e')
		expect(deDiff.events).length(1)

		const afDiff = await tester.diff('a', 'f')
		expect(afDiff.events).length(2)
	})
})
