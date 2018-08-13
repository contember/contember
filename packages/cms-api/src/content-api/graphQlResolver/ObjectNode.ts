import FieldNode from './FieldNode'

export default class ObjectNode<Args = any> {
	constructor(
		public readonly name: string,
		public readonly alias: string,
		public readonly fields: (ObjectNode | FieldNode)[],
		public readonly args: Args
	) {}
}
