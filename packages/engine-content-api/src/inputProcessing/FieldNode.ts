export class FieldNode {
	constructor(
		public readonly name: string,
		public readonly alias: string,
		public readonly meta: { [key: string]: any },
	) {}
}
