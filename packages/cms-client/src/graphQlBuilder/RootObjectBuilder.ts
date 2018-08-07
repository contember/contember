import ObjectBuilder from './ObjectBuilder'

export default class RootObjectBuilder {
	constructor(public readonly objects: { [name: string]: ObjectBuilder } = {}) {}

	public object(name: string, builder: ((builder: ObjectBuilder) => ObjectBuilder) | ObjectBuilder): RootObjectBuilder {
		if (!(builder instanceof ObjectBuilder)) {
			builder = builder(new ObjectBuilder())
		}

		return new RootObjectBuilder({ ...this.objects, [name]: builder })
	}
}
