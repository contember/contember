import jsyaml from 'js-yaml'
import { JSONObject } from './json.js'
import { readFile } from 'fs/promises'


export const readYaml = async <T = JSONObject>(path: string): Promise<T> => {
	const content = await readFile(path, { encoding: 'utf8' })
	return jsyaml.load(content) as unknown as T
}
