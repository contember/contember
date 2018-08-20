import FieldNode from './FieldNode'

export default class ObjectNode<Args = any> {
	constructor(
		public readonly name: string,
		public readonly alias: string,
		public readonly fields: (ObjectNode | FieldNode)[],
		public readonly args: Args
	) {}

	public withArg<
		NewArgs = Args,
		Name extends keyof NewArgs = keyof NewArgs,
		Value extends NewArgs[Name] = NewArgs[Name]
	>(name: Name, value: Value): ObjectNode<NewArgs> {
		return new ObjectNode(this.name, this.alias, this.fields, { ...(this.args as any), [name]: value })
	}
}
