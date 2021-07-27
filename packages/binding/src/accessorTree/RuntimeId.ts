import { generateEnumerabilityPreventingEntropy } from '../utils'

export interface RuntimeIdSpec {
	existsOnServer: boolean
	value: string
}

export class ServerGeneratedUuid implements RuntimeIdSpec {
	public get existsOnServer(): true {
		return true
	}
	public constructor(public readonly value: string) {}
}

export class ClientGeneratedUuid implements RuntimeIdSpec {
	public get existsOnServer(): false {
		return false
	}
	public constructor(public readonly value: string) {}
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
	public static matchesDummyId(candidate: string): boolean {
		return UnpersistedEntityDummyId.dummyIdRegex.test(candidate)
	}
}

export type RuntimeId = ServerGeneratedUuid | ClientGeneratedUuid | UnpersistedEntityDummyId
