import { dirname, extname, join } from 'path'
import { promisify } from 'util'
import { readFile } from 'fs'
import { YamlAdapter } from './adapters/YamlAdapter'
import { JsonAdapter } from './adapters/JsonAdapter'
import Merger from './Merger'

const fsRead = promisify(readFile)

class Loader {
	constructor(
		private readonly adapters: { [extensions: string]: Loader.Adapter } = {
			yaml: new YamlAdapter(),
			json: new JsonAdapter()
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

		const configWithIncludes = await this.includeConfigs(config, dirname(filename), parameters)

		if (Object.keys(parameters).length === 0) {
			return configWithIncludes
		}
		return this.replaceParameters(configWithIncludes, parameters)
	}

	private async includeConfigs(data: any, baseDir: string, parameters: any): Promise<any> {
		if (Array.isArray(data)) {
			return await Promise.all(data.map(async it => await this.includeConfigs(it, baseDir, parameters)))
		}
		if (data === null || typeof data !== 'object') {
			return data
		}
		const { _include, ...rest } = (await Promise.all(
			Object.entries(data).map(async ([key, value]) => [key, await this.includeConfigs(value, baseDir, parameters)])
		)).reduce<any>((acc, [key, value]) => ({ ...acc, [key]: value }), {})

		if (!_include) {
			return rest
		}
		if (!Array.isArray(_include)) {
			throw new Loader.InvalidConfigError(`Only arrays are expected under _include key`)
		}
		return Merger.merge(
			...(await Promise.all(
				(_include || []).map(async file => {
					const nestedConfig = await this.load(join(baseDir, file), parameters)
					if (typeof nestedConfig !== 'object' || nestedConfig === null) {
						throw new Loader.InvalidConfigError(`Only object configs can be included`)
					}
					return nestedConfig
				})
			)),
			rest
		)
	}

	private replaceParameters(data: any, parameters: any): any {
		if (Array.isArray(data)) {
			return data.map(it => this.replaceParameters(it, parameters))
		}
		if (typeof data === 'string') {
			const match = /^%(\w+(?:\.\w+)*)(?:::(\w+))?%$/.exec(data)
			if (match) {
				const [, parameter, cast] = match
				const parts = parameter.split('.')
				const value = parts.reduce((current, part) => {
					if (current === null || typeof current !== 'object' || typeof current[part] === 'undefined') {
						throw new Loader.UndefinedParameterError(`Parameter "${parameter}" not found.`)
					}
					return current[part]
				}, parameters)
				if (cast) {
					switch (cast) {
						case 'number':
							return Number(value)
						case 'string':
							return String(value)
						default:
							throw new Error(`Unsupported cast to ${cast}`)
					}
				}
				return value
			} else {
				return data
			}
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

	export class InvalidConfigError extends Error {}
}

export default Loader
