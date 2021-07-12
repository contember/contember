import { dirname, extname, join } from 'path'
import { promises as fs } from 'fs'
import { YamlAdapter } from './adapters/YamlAdapter'
import { JsonAdapter } from './adapters/JsonAdapter'
import Merger from './Merger'

class Loader {
	constructor(
		private readonly adapters: { [extensions: string]: Loader.Adapter } = {
			yaml: new YamlAdapter(),
			json: new JsonAdapter(),
		},
	) {}

	public async load(filename: string): Promise<any> {
		const ext = extname(filename)
		if (!ext) {
			throw new Loader.UnresolvedAdapterError(`File ${filename} does not have an extension.`)
		}
		const extWithoutDot = ext.slice(1)
		if (!this.adapters[extWithoutDot]) {
			throw new Loader.UnresolvedAdapterError(`Adapter for ${extWithoutDot} not found.`)
		}
		const file = await fs.readFile(filename, { encoding: 'utf8' })
		const config = this.adapters[extWithoutDot].parse(file)

		return await this.includeConfigs(config, dirname(filename))
	}

	public async loadString(content: string, adapter: string): Promise<any> {
		if (!this.adapters[adapter]) {
			throw new Loader.UnresolvedAdapterError(`Adapter for ${adapter} not found.`)
		}
		return this.adapters[adapter].parse(content)
	}

	private async includeConfigs(data: any, baseDir: string): Promise<any> {
		if (Array.isArray(data)) {
			return await Promise.all(data.map(async it => await this.includeConfigs(it, baseDir)))
		}
		if (data === null || typeof data !== 'object') {
			return data
		}
		const { _include, ...rest } = (
			await Promise.all(
				Object.entries(data).map(async ([key, value]) => [key, await this.includeConfigs(value, baseDir)]),
			)
		).reduce<any>((acc, [key, value]) => ({ ...acc, [key]: value }), {})

		if (!_include) {
			return rest
		}
		if (!Array.isArray(_include)) {
			throw new Loader.InvalidConfigError(`Only arrays are expected under _include key`)
		}
		return Merger.merge(
			...(await Promise.all(
				(_include || []).map(async file => {
					const nestedConfig = await this.load(join(baseDir, file))
					if (typeof nestedConfig !== 'object' || nestedConfig === null) {
						throw new Loader.InvalidConfigError(`Only object configs can be included`)
					}
					return nestedConfig
				}),
			)),
			rest,
		)
	}
}

namespace Loader {
	export interface Adapter {
		parse(input: string): any
	}

	export class UnresolvedAdapterError extends Error {}

	export class InvalidConfigError extends Error {}
}

export default Loader
