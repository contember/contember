import * as fs from 'fs/promises'
import * as path from 'path'

export async function writeMarkdownFile(filePath: string, content: string): Promise<void> {
	try {
		const dirPath = path.dirname(filePath)

		// Check if all example count markers are in the content
		const hasExamplesCount = content.includes('<!-- Examples count:')
		const hasSourceExamples = content.includes('<!-- Source examples:')
		const hasPlaygroundExamples = content.includes('<!-- Playground examples:')
		const hasExternalExamples = content.includes('<!-- External examples:')
		
		if (!hasExamplesCount || !hasSourceExamples || !hasPlaygroundExamples || !hasExternalExamples) {
			console.warn(`Warning: Some metadata markers are missing in ${filePath}:` + 
				`${!hasExamplesCount ? ' total_count' : ''}` +
				`${!hasSourceExamples ? ' source_examples' : ''}` +
				`${!hasPlaygroundExamples ? ' playground_examples' : ''}` +
				`${!hasExternalExamples ? ' external_examples' : ''}`)
		}

		await fs.mkdir(dirPath, { recursive: true })
		await fs.writeFile(filePath, content, 'utf-8')
	} catch (error) {
		console.error(`Error writing Markdown file ${filePath}:`, error)
		throw error
	}
}
