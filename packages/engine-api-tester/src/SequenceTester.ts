import { GQL } from './tags'
import { AnyEvent, CreateEvent } from '@contember/engine-common'
import { EventSequence } from './EventSequence'
import { QueryHandler } from '@contember/queryable'
import { DatabaseQueryable } from '@contember/database'
import { ContentApiTester } from './ContentApiTester'
import { SystemApiTester } from './SystemApiTester'
import { createCreateEvent } from './DummyEventFactory'
import * as assert from 'uvu/assert'

export class SequenceTester {
	constructor(
		private readonly queryHandler: QueryHandler<DatabaseQueryable>,
		private readonly contentApiTester: ContentApiTester,
		private readonly systemApiTester: SystemApiTester,
	) {}

	public async runSequence(sequences: EventSequence.StringSequenceSet): Promise<void> {
		const sequenceSet = EventSequence.parseSet(sequences)

		const executed = new Set<string>()
		for (const sequence of sequenceSet) {
			if (sequence.baseStage && !executed.has(sequence.baseStage)) {
				throw new Error('Sequences has to be sorted')
			}
			await this.executeSingleSequence(sequence)
			executed.add(sequence.stage)
		}
	}

	private async executeSingleSequence(sequence: EventSequence): Promise<void> {
		let follow: number | null = 0
		const releaseForward = async () => {
			if (follow) {
				if (!sequence.baseStage) {
					throw new Error()
				}
				await this.systemApiTester.releaseForward(sequence.baseStage, sequence.stage, follow)
			}
			follow = null
		}
		for (const event of sequence.sequence) {
			switch (event.type) {
				case 'event':
					await releaseForward()
					await this.contentApiTester.queryContent(
						sequence.stage,
						GQL`mutation ($number: Int!) {
							createEntry(data: {number: $number}) {
								ok
              				}
						}`,
						{ number: event.number },
					)
					break
				case 'follow':
					if (follow === null) {
						throw new Error('cannot follow after custom event')
					}
					follow++
					break
			}
		}
		await releaseForward()
	}

	public async verifySequence(
		sequences: EventSequence.StringSequenceSet,
		eventsMap: Record<number, AnyEvent>,
	): Promise<void> {
		const sequenceSet = EventSequence.parseSet(sequences)

		const events: Record<string, AnyEvent[]> = {}
		for (const sequence of sequenceSet) {
			events[sequence.stage] = await this.systemApiTester.fetchEvents(sequence.stage)
		}

		for (const sequence of sequenceSet) {
			for (const i in sequence.sequence) {
				const sequenceItem = sequence.sequence[i]

				const event = events[sequence.stage][i]
				assert.not.equal(event, undefined)

				switch (sequenceItem.type) {
					case 'event':
						const expectedEvent =
							eventsMap[sequenceItem.number] ||
							createCreateEvent((event as CreateEvent).rowId[0], 'entry', { number: sequenceItem.number })

						this.assertEventEquals(expectedEvent, event)
						break
					case 'follow':
						if (!sequence.baseStage) {
							throw new Error()
						}
						const baseEvent = events[sequence.baseStage][i]
						assert.not.equal(baseEvent, undefined)
						assert.is(event.id, baseEvent.id)
						break
				}
			}
		}
	}

	private assertEventEquals(expected: AnyEvent, actual: AnyEvent) {
		let {
			id: {},
			transactionId: {},
			createdAt: {},
			identityId: {},
			...restExpected
		} = expected
		let {
			id: {},
			transactionId: {},
			createdAt: {},
			identityId: {},
			...restActual
		} = actual
		assert.equal(restActual, restExpected)
	}
}
