import * as fs from 'fs'
import { promisify } from 'util'
import * as path from 'path'
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore-line
import autocannonCompare from 'autocannon-compare'

const fileRead = promisify(fs.readFile)
const dirRead = promisify(fs.readdir)
const fileExists = promisify(fs.exists)
;(async () => {
	const [{}, {}, aName, bName] = process.argv
	const resultsPath = path.join(__dirname, '/../../results/')
	for (const file of await dirRead(path.join(resultsPath, aName))) {
		const aFile = path.join(resultsPath, aName, file)
		const bFile = path.join(resultsPath, bName, file)
		if (!(await fileExists(bFile))) {
			continue
		}
		console.log('\n\nFile: ' + file)
		const readFile = async (path: string): Promise<any> => JSON.parse(await fileRead(path, { encoding: 'utf8' }))
		const [aData, bData] = await Promise.all([readFile(aFile), readFile(bFile)])

		const result = autocannonCompare(aData, bData)

		console.log(JSON.stringify(result, null, 2))
	}
})().catch(e => {
	console.error(e)
	process.exit(1)
})
