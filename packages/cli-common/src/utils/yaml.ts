import { JSONObject, JSONPrimitive } from './json'
import { pathExists } from 'fs-extra'
import { promises as fs } from 'fs'
import YAWN from 'yawn-yaml/cjs'
import { Merger } from '@contember/config-loader'
import jsyaml from 'js-yaml'

export type JsonUpdateCallback<Value = JSONObject> = (
	data: Partial<Value>,
	utils: { merge: (a: JSONObject, b: JSONObject) => JSONObject },
) => Value

export const updateYaml = async <Value = JSONObject>(
	path: string,
	updater: JsonUpdateCallback<Value>,
	options: { createMissing?: boolean } = {},
) => {
	let config = ''
	if (await pathExists(path)) {
		config = await fs.readFile(path, { encoding: 'utf8' })
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

	await fs.writeFile(path, newConfig, { encoding: 'utf8' })
}

export const readYaml = async <T = JSONObject>(path: string): Promise<T> => {
	const content = await fs.readFile(path, { encoding: 'utf8' })
	return jsyaml.load(content) as unknown as T
}
