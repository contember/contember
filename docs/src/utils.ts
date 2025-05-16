import * as fs from 'fs'
import { Glob } from 'bun'

export async function findComponentFiles(sourceDir: string, pattern?: string): Promise<string[]> {
	try {
		if (!fs.existsSync(sourceDir) || !fs.lstatSync(sourceDir).isDirectory()) {
			console.error(`Source directory does not exist or is not a directory: ${sourceDir}`)
			return []
		}
	} catch (error) {
		console.error(`Error accessing source directory ${sourceDir}:`, error)
		return []
	}

	const globPattern = pattern || '**/*.{ts,tsx,js,jsx}'

	// eslint-disable-next-line no-console
	console.log(`Searching for component files in: ${sourceDir}`)
	// eslint-disable-next-line no-console
	console.log(`Using pattern: ${globPattern}`)

	try {
		const glob = new Glob(globPattern)
		const files: string[] = []
		const scanOptions = {
			cwd: sourceDir,
			absolute: true,
			onlyFiles: true,
			dot: false,
		}

		for await (const file of glob.scan(scanOptions)) {
			files.push(file)
		}

		if (files.length === 0) {
			console.warn(`No files matched the pattern "${globPattern}" in ${sourceDir}`)
		}

		return files
	} catch (error) {
		console.error(`Error during file search with pattern "${globPattern}" in ${sourceDir}:`, error)
		return []
	}
}

export const kebabCase = (str: string) => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
