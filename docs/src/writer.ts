import * as fs from 'fs/promises'
import * as path from 'path'

export async function writeMarkdownFile(filePath: string, content: string): Promise<void> {
	try {
		const dirPath = path.dirname(filePath)

		// Check if examples count marker is in the content
		const hasExamplesCount = content.includes('<!-- Examples count:')
		if (!hasExamplesCount) {
			console.warn(`Warning: Examples count marker is missing in ${filePath}`)
		}

		await fs.mkdir(dirPath, { recursive: true })
		await fs.writeFile(filePath, content, 'utf-8')
	} catch (error) {
		console.error(`Error writing Markdown file ${filePath}:`, error)
		throw error
	}
}
