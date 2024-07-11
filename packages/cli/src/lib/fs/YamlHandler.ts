import { readFile, writeFile } from 'node:fs/promises'
import jsyaml from 'js-yaml'
import { FileSystem } from './FileSystem'
import YAWN from 'yawn-yaml'
import { JSONObject, JSONPrimitive } from '../json'
import { Merger } from '@contember/config-loader'

export type JsonUpdateCallback<Value = JSONObject> = (
	data: Partial<Value>,
	utils: { merge: (a: JSONObject, b: JSONObject) => JSONObject },
) => Value

export class YamlHandler {
	constructor(
		private readonly fs: FileSystem,
	) {
	}

	readYaml = async <T = unknown>(path: string): Promise<T> => {
		const content = await this.fs.readFile(path, { encoding: 'utf8' })
		return jsyaml.load(content) as unknown as T
	}

	tryReadYaml = async <T = unknown>(path: string): Promise<T | null> => {
		try {
			return await this.readYaml<T>(path)
		} catch (e: any) {
			if (e.code === 'ENOENT') {
				return null
			}
			throw e
		}
	}

	updateYaml = async <Value = JSONObject>(
		path: string,
		updater: JsonUpdateCallback<Value>,
		options: { createMissing?: boolean } = {},
	) => {
		let config = ''
		if (await this.fs.pathExists(path)) {
			config = await readFile(path, { encoding: 'utf8' })
		} else if (options.createMissing !== true) {
			throw new Error(`File ${path} does not exist.`)
		}

		let newConfig = ''
		const mergeUtils = { merge: (a: JSONObject, b: JSONObject) => Merger.merge<JSONPrimitive>(a, b) }
		if (config) {
			const yawn = new YAWN(config)
			yawn.json = updater(yawn.json, mergeUtils)
			newConfig = yawn.yaml
		} else {
			newConfig = jsyaml.dump(updater({}, mergeUtils))
		}

		await writeFile(path, newConfig, { encoding: 'utf8' })
	}
}
