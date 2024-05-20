import { execSync } from 'child_process'
import glob from 'fast-glob'
import * as fs from 'fs/promises'
import { join } from 'path'

(async () => {
	const CWD = process.cwd()

	const headTimestamp = parseInt(execSync('git log -1 --format=%at').toString().trim()) * 1000
	const tsbuildinfoTimestamp = (await fs.stat(join(CWD, 'dist/tsconfig.tsbuildinfo'))).mtimeMs

	if (headTimestamp > tsbuildinfoTimestamp) {
		console.error('Please run `yarn build` before running this script.')
		process.exit(0)
	}

	if (!checkGitStatus()) {
		console.error('Git status is not clean. Please commit your changes before running this script.')
		process.exit(0)
	}

	const LOCAL_REF = `${execSync('git describe --tags --abbrev=0').toString().trim()}-${execSync('git rev-parse --short HEAD').toString().trim()}`
	console.log(`LOCAL_REF: ${LOCAL_REF}`)

	const dirs = (await glob(CWD + '/packages/*', { onlyDirectories: true }))
		.filter(dir => !dir.endsWith('packages/admin-sandbox'))

	const outDirPath = join(CWD, 'dist')
	await createDirectoryIfNotExists(outDirPath)

	// delete old files:
	const files = await glob(outDirPath + '/contember-*.tgz')
	await Promise.all(files.map(async file => {
		await fs.unlink(file)
	}))

	await Promise.all(dirs.map(async (dir): Promise<void> => {
		try {
			await fs.copyFile(`${dir}/package.json`, `${dir}/package.json.bkp`)
		} catch (e) {
			console.error(`Failed to backup package.json in ${dir}`)
			throw e
		}

		await bumpVersion(dir, outDirPath, LOCAL_REF)
		await npmPack(dir, outDirPath)

		try {
			await fs.copyFile(`${dir}/package.json.bkp`, `${dir}/package.json`)
			await fs.unlink(`${dir}/package.json.bkp`)
		} catch (e) {
			console.error(`Failed to restore package.json in ${dir}`)
			throw e
		}
	}))
})().catch(e => {
	console.error(e)
	process.exit(1)
})

async function bumpVersion(directory: string, targetDirectory: string, localRef: string) {
	console.log(`Bumping version for ${directory} to ${targetDirectory} ...`)
	const packageJsonPath = join(directory, 'package.json')

	const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8')

	if (!packageJsonContent) {
		throw new Error(`package.json in ${directory} is empty!`)
	}

	const packageJson = JSON.parse(packageJsonContent)

	if (!packageJson) {
		throw new Error(`package.json in ${directory} is invalid!`)
	}

	packageJson.version = localRef

	for (const dependencyType of ['dependencies', 'peerDependencies', 'devDependencies']) {
		if (packageJson[dependencyType]) {
			for (const dependencyName of Object.keys(packageJson[dependencyType])) {
				if (dependencyName.startsWith('@contember/') && packageJson[dependencyType][dependencyName].startsWith('workspace:')) {
					packageJson[dependencyType][dependencyName] = asLocalTgzPath(targetDirectory, dependencyName, localRef)
				}
			}
		}
	}

	await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
	console.log(`Version bumped successfully for ${directory}!`)
}

function asLocalTgzPath(targetDirectory: string, dependencyName: string, version: string) {
	return `file:${targetDirectory}/${dependencyName.substring(1).replace(/[^\w]/, '-')}-${version}.tgz`
}

async function npmPack(directory: string, destinationPath: string) {
	console.log(`Packaging ${directory} ... ${destinationPath}`)

	try {
		execSync(`npm pack --pack-destination "${destinationPath}"`, { cwd: directory, stdio: 'inherit' })
		console.log(`${directory} packaged successfully!`)
	} catch (error) {
		throw new Error(`Failed to package ${directory}. Error: ${error.message}`)
	}
}

async function createDirectoryIfNotExists(directoryPath) {
	try {
		await fs.access(directoryPath) // Check if the directory already exists
		console.log('Directory already exists.')
	} catch (error) {
		if (error.code === 'ENOENT') { // ENOENT error code indicates the directory does not exist
			await fs.mkdir(directoryPath)
			console.log('Directory created successfully.')
		} else {
			throw error
		}
	}
}

function checkGitStatus(): boolean {
	const output = execSync('git status -s', { encoding: 'utf-8' })
	return output.trim() === ''
}
