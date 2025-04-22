import * as fs from 'fs/promises'
import * as path from 'path'

/**
 * Writes the generated Markdown content to a specified file path.
 * Ensures the directory exists before writing.
 *
 * @param filePath - The absolute path where the .mdx file should be saved.
 * @param content - The Markdown content string to write.
 * @returns A promise that resolves when writing is complete, or rejects on error.
 */
export async function writeMarkdownFile(filePath: string, content: string): Promise<void> {
	try {
		// Ensure the output directory exists (though config.ts might already do this)
		const dirPath = path.dirname(filePath)
		await fs.mkdir(dirPath, { recursive: true })

		// Write the file
		await fs.writeFile(filePath, content, 'utf-8')
		// console.log(`Successfully wrote file: ${filePath}`); // Logging moved to main.ts

	} catch (error) {
		console.error(`Error writing Markdown file ${filePath}:`, error)
		// Re-throw the error so the main loop can catch it if needed
		throw error
	}
}
