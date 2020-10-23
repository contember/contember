export interface RuntimeId {
	existsOnServer: boolean
	value: string
}

export class ServerGeneratedUuid implements RuntimeId {
	public get existsOnServer(): true {
		return true
	}
	public constructor(public readonly value: string) {}
}

export class ClientGeneratedUuid implements RuntimeId {
	public get existsOnServer(): false {
		return false
	}
	public constructor(public readonly value: string) {}
}

export class UnpersistedEntityKey implements RuntimeId {
	public get existsOnServer(): false {
		return false
	}
	public readonly value: string

	private static getNextSeed = (() => {
		let seed = 0
		return () => seed++
	})()

	public constructor() {
		this.value = `unpersistedEntity-${UnpersistedEntityKey.getNextSeed()}`
	}
}
