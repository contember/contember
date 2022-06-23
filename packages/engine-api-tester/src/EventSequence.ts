import { StageConfig } from '@contember/engine-system-api'
import { testUuid } from './testUuid.js'

class EventSequence {
	constructor(
		public readonly stage: string,
		public readonly baseStage: string | undefined,
		public readonly sequence: EventSequence.SequencePart[],
	) {}
}

namespace EventSequence {
	export type SequencePart = Follow | Event

	export class Follow {
		public readonly type = 'follow'
	}

	export enum EventModifier {
		changed = '*',
	}

	export type Sequences = EventSequence[]
	export type StringSequenceSet = { [stage: string]: string }

	export class Event {
		public readonly type = 'event'

		constructor(public readonly number: number, public readonly modifier?: EventModifier) {}
	}

	export function parse(stage: string, data: string): EventSequence {
		const matchResult = (data.trim() + ' ').match(/^((?<baseStage>[a-z]+)\s+)?(?<sequence>(-\s+)*([0-9]+\*?\s+)*)$/)
		if (!matchResult) {
			throw new Error('Invalid sequence format')
		}
		const items: SequencePart[] = []
		for (let part of matchResult.groups?.sequence.trim().split(/\s+/) || []) {
			if (part === '-') {
				items.push(new Follow())
			} else {
				let modifier: EventModifier | undefined
				if (part.endsWith('*')) {
					modifier = EventModifier.changed
					part = part.substring(0, part.length - 1)
				}
				items.push(new Event(Number(part), modifier))
			}
		}
		return new EventSequence(stage, matchResult.groups?.baseStage, items)
	}

	export function parseSet(sequences: StringSequenceSet): Sequences {
		const result: Sequences = []
		let hasRoot = false
		for (const stage in sequences) {
			const sequence = parse(stage, sequences[stage])
			if (!sequence.baseStage) {
				if (sequence.sequence.find(it => it.type === 'follow')) {
					throw new Error('Base stage cannot have "follow" part')
				}
				if (hasRoot) {
					throw new Error('There is already a root stage')
				}
				hasRoot = true
			} else {
				if (!sequences[sequence.baseStage]) {
					throw new Error(`Undefined stage ${sequences[sequence.baseStage]}`)
				}
			}
			result.push(sequence)
		}
		if (!hasRoot) {
			throw new Error('No root stage is defined')
		}
		return result
	}

	export function createStagesConfiguration(sequences: StringSequenceSet): StageConfig[] {
		const sequenceSet = parseSet(sequences)
		return sequenceSet.map((it, index) => ({
			id: testUuid(index + 1),
			name: it.stage,
			slug: it.stage,
			base: it.baseStage,
		}))
	}
}

export { EventSequence }
