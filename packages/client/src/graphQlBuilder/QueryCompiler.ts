import { Literal } from './Literal'
import { ObjectBuilder } from './ObjectBuilder'
import { RootObjectBuilder } from './RootObjectBuilder'

export class QueryCompiler {
	constructor(private operation: 'query' | 'mutation', private builder: RootObjectBuilder) {}

	public create(): string {
		return `${this.operation} {\n${this.formatRootObject(this.builder)}\n}`
	}

	private formatRootObject(builder: RootObjectBuilder): string {
		const lines: string[] = []

		for (const alias in builder.objects) {
			lines.push(...this.formatObject(alias, builder.objects[alias]).map(val => `\t${val}`))
		}

		return lines.join('\n')
	}

	private formatObject(alias: string, builder: ObjectBuilder): string[] {
		const result = []

		result.push(`${alias}${builder.objectName ? `: ${builder.objectName}` : ''}${this.formatArgs(builder.args, 0)} {`)

		result.push(...this.formatObjectBody(builder))

		result.push('}')

		return result
	}

	private formatObjectBody(builder: ObjectBuilder): string[] {
		const result = []
		for (const fieldName of builder.fields) {
			result.push(fieldName)
		}
		for (const typeName in builder.fragments) {
			const fragment = builder.fragments[typeName]
			result.push(`... on ${typeName} {`, ...this.formatObjectBody(fragment), '}')
		}
		for (const alias in builder.objects) {
			result.push(...this.formatObject(alias, builder.objects[alias]))
		}
		return result.map(val => `\t${val}`)
	}

	private formatArgs(args: any, level: number): string {
		if (args === null) {
			return 'null'
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
			return `[${vals.join(', ')}]`
		}
		if (args instanceof Literal) {
			return args.value
		}

		if (typeof args === 'object') {
			let result = ''
			for (let key in args) {
				const argValue = args[key]
				if (argValue === undefined) {
					continue
				}
				result += `${key}: ${this.formatArgs(argValue, level + 1)}, `
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
