import { join } from 'path'
import { runCommand } from './commands'
import { pathExists, listDirectories } from '@contember/cli-common'
import fs from 'fs/promises'

export interface NpmPackageUpdate {
	name: string
	version: string
}

const install = async (hasYarn: boolean, packages: string[], isDev: boolean, dir: string) => {
	const [cmd, ...args] = hasYarn
		? ['yarn', 'add', isDev ? '--dev' : undefined, '--ignore-workspace-root-check']
		: ['npm', 'install', isDev ? '--save-dev' : '--save']
	const label = isDev ? 'devDependencies' : 'dependencies'
	if (packages.length === 0) {
		console.log(`No npm ${label} to update.`)
		return
	}
	console.log(`Updating npm ${label}: ${packages.join(', ')}`)
	const { output } = runCommand(cmd, [...args, ...packages], {
		cwd: dir,
		stderr: process.stderr,
		stdout: process.stdout,
	})
	await output
	console.log('npm update done')
}

export const updateNpmPackages = async (packages: NpmPackageUpdate[], workspaceDirectory: string) => {
	const hasYarn = await pathExists(join(workspaceDirectory, 'yarn.lock'))
	const processPackageFile = async (dir: string) => {
		const packageJsonFile = join(dir, 'package.json')
		if (!(await pathExists(packageJsonFile))) {
			return
		}
		const packageJson = JSON.parse(await fs.readFile(packageJsonFile, 'utf-8'))
		const isRoot = workspaceDirectory === dir
		const upgradeDeps = async (type: 'dependencies' | 'devDependencies') => {
			const deps = packageJson[type] || {}
			const packagesToUpdate = packages.filter(it => !!deps[it.name]).map(it => `${it.name}@${it.version}`)
			await install(hasYarn, packagesToUpdate, type === 'devDependencies', dir)
		}
		await upgradeDeps('dependencies')
		await upgradeDeps('devDependencies')
		if (hasYarn && isRoot && packageJson.workspaces) {
			const dirsPromise = (packageJson.workspaces as string[]).map(async (it): Promise<string[]> => {
				if (it.substr(-1) === '*') {
					const baseDir = it.substring(0, it.length - 1)
					return await listDirectories(baseDir)
				} else {
					return [join(dir, it)]
				}
			})
			const workspaceDirs = (await Promise.all(dirsPromise)).flatMap(it => it)
			for (const dir of workspaceDirs) {
				await processPackageFile(dir)
			}
		}
	}
	await processPackageFile(workspaceDirectory)
}
