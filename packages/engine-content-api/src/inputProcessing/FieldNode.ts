export class FieldNode<Extensions extends Record<string, any> = Record<string, any>> {
	constructor(public readonly name: string, public readonly alias: string, public readonly extensions: Extensions) {}
}
