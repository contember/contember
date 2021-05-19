import { isEmptyObject } from '../utils'
import { GraphQlBuilderError } from './GraphQlBuilderError'
import { ObjectBuilder } from './ObjectBuilder'

export class RootObjectBuilder {
	constructor(
		public readonly objects: { [name: string]: ObjectBuilder } = {},
		public readonly fragmentDefinitions: { [name: string]: ObjectBuilder } = {},
	) {}

	public fragment(
		name: string,
		builder: ((builder: ObjectBuilder) => ObjectBuilder) | ObjectBuilder,
	): RootObjectBuilder {
		if (!(builder instanceof ObjectBuilder)) {
			builder = builder(new ObjectBuilder())
		}

		if (!isEmptyObject(builder.args)) {
			throw new GraphQlBuilderError(`Cannot supply args to Graph QL fragments!`)
		}
		if (!builder.objectName) {
			throw new GraphQlBuilderError(`Object names are mandatory for Graph QL fragments!`)
		}

		return new RootObjectBuilder(this.objects, { ...this.fragmentDefinitions, [name]: builder })
	}

	public object(name: string, builder: ((builder: ObjectBuilder) => ObjectBuilder) | ObjectBuilder): RootObjectBuilder {
		if (!(builder instanceof ObjectBuilder)) {
			builder = builder(new ObjectBuilder())
		}

		return new RootObjectBuilder({ ...this.objects, [name]: builder }, this.fragmentDefinitions)
	}
}
