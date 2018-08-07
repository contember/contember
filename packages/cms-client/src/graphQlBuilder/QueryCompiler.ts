import ObjectBuilder from './ObjectBuilder'
import Literal from './Literal'
import RootObjectBuilder from './RootObjectBuilder'

interface GenericObjectBuilder {
	readonly objects: { [name: string]: ObjectBuilder }
}

export default class QueryCompiler {
	constructor(private operation: 'query' | 'mutation', private builder: RootObjectBuilder) {}

	public create(): string {
		return `${this.operation} {
${this.formatObject(this.builder).join('\n')}     
}`
	}

	private formatObject(builder: GenericObjectBuilder): string[] {
		const result = []

		for (let alias in builder.objects) {
			const subObject = builder.objects[alias]
			result.push(
				alias + (subObject.objectName ? `: ${subObject.objectName}` : '') + this.formatArgs(subObject.args, 0) + ' {'
			)
			for (let fieldName of subObject.fields) {
				result.push('\t' + fieldName)
			}

			const formatted = this.formatObject(subObject)
			result.push(...formatted)
			result.push('}')
		}

		return result.map(val => '\t' + val)
	}

	private formatArgs(args: any, level: number): string {
		if (args === null) {
			return 'NULL'
		}

		if (typeof args === 'number') {
			return args.toString()
		}

		if (typeof args === 'boolean') {
			return args ? 'true' : 'false'
		}
		if (typeof args === 'string') {
			return JSON.stringify(args)
		}

		if (Array.isArray(args)) {
			const vals = args.map(val => this.formatArgs(val, level + 1))
			return '[' + vals.join(', ') + ']'
		}
		if (args instanceof Literal) {
			return args.value
		}

		if (typeof args === 'object') {
			let result = ''
			for (let key in args) {
				result += `${key}: ${this.formatArgs(args[key], level + 1)}, `
			}
			if (result.length > 0) {
				result = result.substring(0, result.length - 2)
			}
			if (level > 0) {
				return `{${result}}`
			} else if (result.length > 0) {
				return `(${result})`
			}
			return ''
		}

		throw new Error(typeof args)
	}
}
