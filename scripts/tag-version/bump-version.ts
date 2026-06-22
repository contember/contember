import * as fs from 'node:fs/promises'
import glob from 'fast-glob'
;(async () => {
	const cwd = process.cwd()
	const version = process.argv[2]
	const dirs = [cwd, ...await glob(process.cwd() + '/packages/*', { onlyDirectories: true })]

	await Promise.all(dirs.map(async (dir): Promise<void> => {
		const packageJsonPath = `${dir}/package.json`
		try {
			await fs.access(packageJsonPath)
		} catch (e) {
			return
		}
		try {
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

	// bun#18906: a version-only bump leaves the workspace package versions recorded
	// in bun.lock stale. `bun pm pack` (publish runs with --frozen-lockfile)
	// substitutes `workspace:*` deps from those stale lockfile versions, so the
	// published packages would pin their internal @contember/* deps at the previous
	// release — causing duplicate-package breakage downstream. Patch the workspace
	// versions in place to match the bump (no re-resolve, so transitive deps don't
	// drift). Workspace entries are the only `{ "name", "version" }` objects in the
	// lockfile (external packages use an array shape), so a "version line directly
	// after a name line" rewrite is safe.
	const lockPath = `${cwd}/bun.lock`
	try {
		const lockLines = (await fs.readFile(lockPath, 'utf8')).split('\n')
		for (let i = 1; i < lockLines.length; i++) {
			if (/^\s*"name":\s*"/.test(lockLines[i - 1]) && /^\s*"version":\s*"/.test(lockLines[i])) {
				lockLines[i] = lockLines[i].replace(/("version":\s*")[^"]*(")/, `$1${version}$2`)
			}
		}
		await fs.writeFile(lockPath, lockLines.join('\n'), 'utf8')
	} catch (e) {
		console.error('failed to patch bun.lock workspace versions')
		throw e
	}
})().catch(e => {
	console.error(e)
	process.exit(1)
})
