import { GQL } from './tags'
import { AnyEvent, CreateEvent } from '../../src/system-api/model/dtos/Event'
import DiffQuery from '../../src/system-api/model/queries/DiffQuery'
import { expect } from 'chai'
import { EventType } from '../../src/system-api/model/EventType'
import EventSequence from './EventSequence'
import InitEventQuery from '../../src/system-api/model/queries/InitEventQuery'
import StageBySlugQuery from '../../src/system-api/model/queries/StageBySlugQuery'
import QueryHandler from '../../src/core/query/QueryHandler'
import KnexQueryable from '../../src/core/knex/KnexQueryable'
import ContentApiTester from './ContentApiTester'
import SystemApiTester from './SystemApiTester'

export default class SequenceTester {
	constructor(
		private readonly queryHandler: QueryHandler<KnexQueryable>,
		private readonly contentApiTester: ContentApiTester,
		private readonly systemApiTester: SystemApiTester
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
		for (const event of sequence.sequence) {
			switch (event.type) {
				case 'event':
					await this.contentApiTester.queryContent(
						sequence.stage,
						GQL`mutation ($number: Int!) {
              createEntry(data: {number: $number}) {
                id
              }
            }`,
						{ number: event.number }
					)
					break
				case 'follow':
					await this.systemApiTester.releaseForward(sequence.stage, sequence.baseStage!, 1)
					break
			}
		}
	}

	public async fetchEvents(stage: string): Promise<AnyEvent[]> {
		const initEvent = await this.queryHandler.fetch(new InitEventQuery())
		const stageHead = (await this.queryHandler.fetch(new StageBySlugQuery(stage)))!.event_id

		return await this.queryHandler.fetch(new DiffQuery(initEvent.id, stageHead))
	}

	public async verifySequence(sequences: EventSequence.StringSequenceSet, skip: number = 0): Promise<void> {
		const sequenceSet = EventSequence.parseSet(sequences)

		const events: Record<string, AnyEvent[]> = {}
		for (const sequence of sequenceSet) {
			events[sequence.stage] = (await this.fetchEvents(sequence.stage)).slice(skip)
		}

		for (const sequence of sequenceSet) {
			for (const i in sequence.sequence) {
				const sequenceItem = sequence.sequence[i]

				const event = events[sequence.stage][i]
				expect(event).not.undefined

				switch (sequenceItem.type) {
					case 'event':
						expect(event.type).eq(EventType.create)
						expect((event as CreateEvent).values).deep.eq({ number: sequenceItem.number })
						break
					case 'follow':
						const baseEvent = events[sequence.baseStage!][i]
						expect(baseEvent).not.undefined

						expect(event.id).eq(baseEvent.id)
						break
				}
			}
		}
	}
}
