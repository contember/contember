import * as fs from 'fs'
import { Glob } from 'bun'

/**
	* Finds component files within a given directory based on a glob pattern.
	*
	* @param sourceDir - The absolute path to the directory to search within.
	* @param pattern - The glob pattern to match files against (e.g., '**\/*.tsx').
	* @returns A promise that resolves to an array of absolute file paths.
	*/
export async function findComponentFiles(sourceDir: string, pattern?: string): Promise<string[]> {
	// Validate source directory existence
	try {
		if (!fs.existsSync(sourceDir) || !fs.lstatSync(sourceDir).isDirectory()) {
			console.error(`Source directory does not exist or is not a directory: ${sourceDir}`)
			return [] // Return empty array if source dir is invalid
		}
	} catch (error) {
		console.error(`Error accessing source directory ${sourceDir}:`, error)
		return [] // Return empty on error
	}

	// Define the glob pattern to use
	// Use provided pattern or default to common component extensions
	const globPattern = pattern || '**/*.{ts,tsx,js,jsx}'

	// eslint-disable-next-line no-console
	console.info(`Searching for component files in: ${sourceDir}`)
	// eslint-disable-next-line no-console
	console.info(`Using pattern: ${globPattern}`)

	try {
		// Using Bun's native Glob implementation
		const glob = new Glob(globPattern)
		const files: string[] = []

		// Configure scan options
		const scanOptions = {
			cwd: sourceDir,
			absolute: true, // Return absolute paths
			onlyFiles: true, // Only match files, not directories
			dot: false, // Ignore dotfiles (like .git, .vscode)
		}

		// Collect all matched files
		for await (const file of glob.scan(scanOptions)) {
			files.push(file)
		}

		if (files.length === 0) {
			console.warn(`No files matched the pattern "${globPattern}" in ${sourceDir}`)
		}

		return files
	} catch (error) {
		console.error(`Error during file search with pattern "${globPattern}" in ${sourceDir}:`, error)
		return [] // Return empty array on glob error
	}
}

export const kebabCase = (str: string) => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
