import * as fs from 'node:fs/promises'
import glob from 'fast-glob'

const cwd = process.cwd()
const rootPackageJson = JSON.parse(await fs.readFile(`${cwd}/package.json`, 'utf8'))
const version = rootPackageJson.version

const dirs = await glob(`${cwd}/packages/*`, { onlyDirectories: true })

await Promise.all(dirs.map(async (dir) => {
	const packageJsonPath = `${dir}/package.json`
	try {
		await fs.access(packageJsonPath)
	} catch {
		return
	}
	const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))
	let changed = false
	for (const depField of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
		const deps = packageJson[depField]
		if (!deps) continue
		for (const [name, value] of Object.entries(deps)) {
			if (typeof value === 'string' && value.startsWith('workspace:')) {
				deps[name] = version
				changed = true
			}
		}
	}
	if (changed) {
		await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, '  ') + '\n', 'utf8')
	}
}))
