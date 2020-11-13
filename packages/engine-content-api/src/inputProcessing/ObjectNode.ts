import { FieldNode } from './FieldNode'

export class ObjectNode<Args = any> {
	constructor(
		public readonly name: string,
		public readonly alias: string,
		public readonly fields: (ObjectNode | FieldNode)[],
		public readonly args: Args,
		public readonly extensions: { [key: string]: any },
		public readonly path: string[],
	) {}

	public withArg<
		NewArgs = Args,
		Name extends keyof NewArgs = keyof NewArgs,
		Value extends NewArgs[Name] = NewArgs[Name]
	>(name: Name, value: Value): ObjectNode<NewArgs> {
		return new ObjectNode(
			this.name,
			this.alias,
			this.fields,
			{ ...(this.args as any), [name]: value },
			this.extensions,
			this.path,
		)
	}

	public withArgs<NewArgs = Args>(args: NewArgs): ObjectNode<NewArgs> {
		return new ObjectNode(this.name, this.alias, this.fields, args, this.extensions, this.path)
	}

	public withField(field: ObjectNode | FieldNode): ObjectNode<Args> {
		return new ObjectNode(
			this.name,
			this.alias,
			[...this.fields.filter(it => it.alias !== field.alias), field],
			this.args,
			this.extensions,
			this.path,
		)
	}

	public findFieldByAlias(alias: string): ObjectNode | FieldNode | undefined {
		return this.fields.find(it => it.alias === alias)
	}

	public findFieldByName(name: string): (ObjectNode | FieldNode)[] {
		return this.fields.filter(it => it.name === name)
	}
}
