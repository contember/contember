import * as fs from 'node:fs/promises'
import glob from "fast-glob";

;(async () => {
	const cwd = process.cwd()
	const version = process.argv[2]
	const dirs = [cwd, ...await glob(process.cwd() + '/{ee,packages}/*', { onlyDirectories: true })]

	await Promise.all(dirs.map(async (dir): Promise<void> => {
		try {
			const packageJsonPath = `${dir}/package.json`;
			const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))
			const newPackageJson = {
				...packageJson,
				version,
			}
			await fs.writeFile(packageJsonPath, JSON.stringify(newPackageJson, null, '  ') + '\n', 'utf8')
		} catch (e) {
			console.log(dir)
			throw e
		}
	}))

})().catch(e => {
	console.error(e)
	process.exit(1)
})
