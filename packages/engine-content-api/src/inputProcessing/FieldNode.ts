export class FieldNode {
	constructor(
		public readonly name: string,
		public readonly alias: string,
		public readonly extensions: { [key: string]: any },
	) {}
}
