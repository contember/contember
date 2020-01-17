import { updateYaml } from './utils/yaml'
import { readJson } from 'fs-extra'
import { join } from 'path'
;(async () => {
	const { version } = await readJson(join(process.cwd(), 'package.json'))
	await updateYaml(join(process.cwd(), process.argv[2]), json => ({
		...json,
		api: {
			...(json.api as object),
			version,
		},
	}))
})().catch(e => {
	console.log(e)
	process.exit(1)
})
