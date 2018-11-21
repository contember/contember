import { extname } from 'path'
import { promisify } from 'util'
import { readFile } from 'fs'
import { YamlAdapter } from './adapters/YamlAdapter'

const fsRead = promisify(readFile)

class Loader {
	constructor(
		private readonly adapters: { [extensions: string]: Loader.Adapter } = {
			yaml: new YamlAdapter()
		}
	) {}

	public async load(filename: string, parameters: any = {}): Promise<any> {
		const ext = extname(filename)
		if (!ext) {
			throw new Loader.UnresolvedAdapterError(`File ${filename} does not have an extension.`)
		}
		const extWithoutDot = ext.slice(1)
		if (!this.adapters[extWithoutDot]) {
			throw new Loader.UnresolvedAdapterError(`Adapter for ${extWithoutDot} not found.`)
		}
		const file = await fsRead(filename, { encoding: 'utf8' })
		const config = this.adapters[extWithoutDot].parse(file)

		if (Object.keys(parameters).length === 0) {
			return config
		}
		return this.replaceParameters(config, parameters)
	}

	private replaceParameters(data: any, parameters: any): any {
		if (Array.isArray(data)) {
			return data.map(it => this.replaceParameters(it, parameters))
		}
		if (typeof data === 'string') {
			return data.replace(/^%(\w+(\.\w+)*)%$/, (match, parameter: string) => {
				const parts = parameter.split('.')
				const value = parts.reduce((current, part) => {
					if (current === null || typeof current !== 'object' || typeof current[part] === 'undefined') {
						throw new Loader.UndefinedParameterError(`Parameter "${parameter}" not found.`)
					}
					return current[part]
				}, parameters)
				return String(value)
			})
		}
		if (data === null) {
			return data
		}
		if (typeof data === 'object') {
			return Object.entries(data)
				.map(([key, value]: [string, any]) => [key, this.replaceParameters(value, parameters)])
				.reduce((result, [key, value]) => ({ ...result, [key]: value }), {})
		}
		return data
	}
}

namespace Loader {
	export interface Adapter {
		parse(input: string): any
	}

	export class UnresolvedAdapterError extends Error {}

	export class UndefinedParameterError extends Error {}
}

export default Loader
