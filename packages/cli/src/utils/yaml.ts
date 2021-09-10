import { JSONObject, JSONPrimitive } from '@contember/cli-common/dist/src/utils/json'
import { pathExists } from 'fs-extra'
import YAWN from 'yawn-yaml/cjs'
import { Merger } from '@contember/config-loader'
import jsyaml from 'js-yaml'
import { readFile, writeFile } from 'fs/promises'

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

