interface RuntimeIdSpec {
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
		const enumerabilityPreventingEntropy = (Math.random() * 1e5).toFixed(0)
		this.value = `adminOnlyDummyId-${enumerabilityPreventingEntropy}-${UnpersistedEntityDummyId.getNextSeed()}`
	}
}

export type RuntimeId = ServerGeneratedUuid | ClientGeneratedUuid | UnpersistedEntityDummyId
