import * as path from 'path'
import { loadConfig } from './config'
import { findComponentFiles } from './utils'
import { generateMarkdownWithAI } from './ai'
import { writeMarkdownFile } from './writer'
import { ComponentSourceData } from './types'
import { parseApiExtractorMd, parseComponentSource } from './parser'

async function main() {
	// eslint-disable-next-line no-console
	console.log('Starting documentation generation...')

	const config = loadConfig()
	// eslint-disable-next-line no-console
	console.log('Configuration loaded.')

	// Get path to API Extractor MD file
	const apiMdPath = config.apiExtractorReportPath.replace('.api.json', '.api.md')
	// eslint-disable-next-line no-console
	console.log('Using API Extractor MD file:', apiMdPath)

	// 2. Find Component Files
	const componentFiles = await findComponentFiles(config.sourceDir, config.componentFilePattern)
	// eslint-disable-next-line no-console
	console.log(`Found ${componentFiles.length} component files.`)

	if (componentFiles.length === 0) {
		// eslint-disable-next-line no-console
		console.log('No component files found. Exiting.')
		return
	}

	let totalComponents = 0

	for (const filePath of componentFiles) {
		// eslint-disable-next-line no-console
		console.log(`\nProcessing file: ${filePath}`)

		try {
			// 3a. Aggregate Sources (Parse JSDoc, find props in API MD)
			const componentsData: ComponentSourceData[] = await parseComponentSource(
				filePath,
				apiMdPath,
			)

			if (componentsData.length === 0) {
				console.warn(`No components found in ${filePath}. Skipping.`)
				continue
			}

			totalComponents += componentsData.length
			// eslint-disable-next-line no-console
			console.log(` -> Found ${componentsData.length} component(s) in file`)

			// Process each component in the file
			for (const sourceData of componentsData) {
				// eslint-disable-next-line no-console
				console.log(`\n -> Processing component: ${sourceData.componentName}`)

				// 3b. Enrich with AI
				// eslint-disable-next-line no-console
				console.log(` -> Generating documentation with AI for ${sourceData.componentName}...`)
				const markdownContent = await generateMarkdownWithAI(
					sourceData,
					config.overrides?.[sourceData.componentName],
					config.ai,
				)

				if (!markdownContent) {
					console.warn(` -> AI generation failed for ${sourceData.componentName}. Skipping.`)
					continue
				}
				// eslint-disable-next-line no-console
				console.log(` -> AI generation successful for ${sourceData.componentName}.`)

				// 3c. Output to Markdown
				const outputFilePath = path.join(config.outputDir, `${sourceData.componentName}.mdx`)
				await writeMarkdownFile(outputFilePath, markdownContent)
				// eslint-disable-next-line no-console
				console.log(` -> Markdown file written to ${outputFilePath}`)
			}

		} catch (error) {
			console.error(`Error processing file ${filePath}:`, error)
			// Continue with next file
		}
	}

	// eslint-disable-next-line no-console
	console.log(`\nDocumentation generation finished. Processed ${totalComponents} components from ${componentFiles.length} files.`)
}

main().catch(error => {
	console.error('Unhandled error during script execution:', error)
	process.exit(1)
})
