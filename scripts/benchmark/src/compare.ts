import { access, readdir, readFile } from 'node:fs/promises'
import * as path from 'node:path'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore-line
import autocannonCompare from 'autocannon-compare'

const exists = async (path: string) => {
	try {
		await access(path)
		return true
	} catch {
		return false
	}
}

;(async () => {
	const [{}, {}, aName, bName] = process.argv
	const resultsPath = path.join(__dirname, '/../../results/')
	for (const file of await readdir(path.join(resultsPath, aName))) {
		const aFile = path.join(resultsPath, aName, file)
		const bFile = path.join(resultsPath, bName, file)
		if (!(await exists(bFile))) {
			continue
		}
		console.log('\n\nFile: ' + file)
		const readJson = async (path: string): Promise<any> => JSON.parse(await readFile(path, 'utf8'))
		const [aData, bData] = await Promise.all([readJson(aFile), readJson(bFile)])

		const result = autocannonCompare(aData, bData)

		console.log(JSON.stringify(result, null, 2))
	}
})().catch(e => {
	console.error(e)
	process.exit(1)
})
