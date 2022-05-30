import { generateEnumerabilityPreventingEntropy } from '../utils'
import { EntityId } from '../treeParameters'

export type UniqueEntityId = string & { __type: 'UniqueEntityId' }

export interface RuntimeIdSpec {
	existsOnServer: boolean
	value: EntityId
	uniqueValue: UniqueEntityId
}

export class ServerId implements RuntimeIdSpec {
	public get existsOnServer(): true {
		return true
	}
	public constructor(public readonly value: EntityId, public readonly entityName: string) {
	}

	get uniqueValue() {
		return ServerId.formatUniqueValue(this.value, this.entityName)
	}

	static formatUniqueValue(id: EntityId, entityName: string): UniqueEntityId {
		return `${entityName}_${id}` as UniqueEntityId
	}
}

export class ClientGeneratedUuid implements RuntimeIdSpec {
	public get existsOnServer(): false {
		return false
	}
	public constructor(public readonly value: string) {}

	get uniqueValue() {
		return this.value as UniqueEntityId
	}
}

export class UnpersistedEntityDummyId implements RuntimeIdSpec {
	public get existsOnServer(): false {
		return false
	}
	public readonly value: string

	private static getNextSeed = (() => {
		let seed = 0
		return () => seed++
	})()

	public constructor() {
		const enumerabilityPreventingEntropy = generateEnumerabilityPreventingEntropy(
			UnpersistedEntityDummyId.entropyLength,
		)

		// KEEP THIS IN SYNC WITH THE REGEX BELOW!!!
		this.value = `adminOnlyDummyId-${enumerabilityPreventingEntropy}-${UnpersistedEntityDummyId.getNextSeed()}`
	}

	private static entropyLength = 5
	private static dummyIdRegex = new RegExp(`^adminOnlyDummyId-\\d{${UnpersistedEntityDummyId.entropyLength}}-\\d+$`)
	public static matchesDummyId(candidate: EntityId): boolean {
		return typeof candidate === 'string' && UnpersistedEntityDummyId.dummyIdRegex.test(candidate)
	}

	get uniqueValue() {
		return this.value as UniqueEntityId
	}
}

export type RuntimeId = ServerId | ClientGeneratedUuid | UnpersistedEntityDummyId
