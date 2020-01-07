export class ObjectBuilder {
	constructor(
		public readonly fields: string[] = [],
		public readonly objects: { [name: string]: ObjectBuilder } = {},
		public readonly args: { [name: string]: any } = {},
		public readonly fragments: { [typeName: string]: ObjectBuilder } = {},
		public readonly objectName?: string,
	) {}

	public argument(name: string, value: any): ObjectBuilder {
		return new ObjectBuilder(
			this.fields,
			this.objects,
			{ ...this.args, [name]: value },
			this.fragments,
			this.objectName,
		)
	}

	public name(name: string): ObjectBuilder {
		return new ObjectBuilder(this.fields, this.objects, this.args, this.fragments, name)
	}

	public field(name: string): ObjectBuilder {
		return new ObjectBuilder([...this.fields, name], this.objects, this.args, this.fragments, this.objectName)
	}

	public object(name: string, builder: ((builder: ObjectBuilder) => ObjectBuilder) | ObjectBuilder): ObjectBuilder {
		if (!(builder instanceof ObjectBuilder)) {
			builder = builder(new ObjectBuilder())
		}

		return new ObjectBuilder(
			this.fields,
			{ ...this.objects, [name]: builder },
			this.args,
			this.fragments,
			this.objectName,
		)
	}

	public fragment(
		typeName: string,
		builder: ((builder: ObjectBuilder) => ObjectBuilder) | ObjectBuilder,
	): ObjectBuilder {
		if (!(builder instanceof ObjectBuilder)) {
			builder = builder(new ObjectBuilder())
		}

		return new ObjectBuilder(
			this.fields,
			this.objects,
			this.args,
			{ ...this.fragments, [typeName]: builder },
			this.objectName,
		)
	}
}
