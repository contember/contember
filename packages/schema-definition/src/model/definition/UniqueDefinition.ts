class UniqueDefinition {
	constructor(public readonly options: UniqueDefinition.Options) {}
}

namespace UniqueDefinition {
	export interface Options {
		fields: string[]
		name?: string
	}
}

export default UniqueDefinition
