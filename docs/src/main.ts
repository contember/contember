import * as path from 'path'
import { loadConfig } from './config'
import { findComponentFiles, kebabCase } from './utils'
import { generateMarkdownWithAI } from './ai'
import { writeMarkdownFile } from './writer'
import { ComponentParser } from './parser'
import { PlaygroundExampleFinder } from './playground-parser'

async function main() {
	const parser = new ComponentParser()
	const playgroundFinder = new PlaygroundExampleFinder()

	// eslint-disable-next-line no-console
	console.log('Starting documentation generation...')

	const config = loadConfig()
	// eslint-disable-next-line no-console
	console.log('Configuration loaded.')

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
	// Track processed components to avoid duplicates
	const processedComponents = new Set<string>()

	for (const filePath of componentFiles) {
		// eslint-disable-next-line no-console
		console.log(`\nProcessing file: ${filePath}`)

		try {
			const componentsData = await parser.parseComponentSource(filePath, processedComponents)

			if (componentsData.length === 0) {
				console.warn(`No components found in ${filePath}. Skipping.`)
				continue
			}

			totalComponents += componentsData.length
			// eslint-disable-next-line no-console
			console.log(` -> Found ${componentsData.length} component(s) in file. [${componentsData.map(c => c.componentName).join(', ')}]`)

			// Process each component in the file
			for (const sourceData of componentsData) {
				// eslint-disable-next-line no-console
				console.log(`\n -> Processing component: ${sourceData.componentName}`)

				processedComponents.add(sourceData.componentName)

				const outputFilePath = path.join(config.outputDir, `${kebabCase(sourceData.componentName)}.mdx`)
				const outputFileExists = await Bun.file(outputFilePath).exists()

				// Check if we need to regenerate documentation based on examples count or modified time
				let regenerate = !outputFileExists
				let existingContent: string | null = null

				if (outputFileExists && sourceData.examples) {
					// Read the existing file to check if examples count has changed
					try {
						existingContent = await Bun.file(outputFilePath).text()
		
						// Look for any examples count marker in the file
						const examplesMarker = existingContent.match(/<!-- Examples count: (\d+) -->/)
						// eslint-disable-next-line no-console
						console.log(` -> Checking examples count marker in existing file...`)
		
						if (examplesMarker && examplesMarker[1]) {
							const existingExamplesCount = parseInt(examplesMarker[1], 10)
							const currentExamplesCount = sourceData.examples.length
			
							// eslint-disable-next-line no-console
							console.log(` -> Found examples count marker: ${existingExamplesCount}, current count: ${currentExamplesCount}`)
			
							// Regenerate if examples count has changed
							if (existingExamplesCount !== currentExamplesCount) {
								// eslint-disable-next-line no-console
								console.log(` -> Examples count changed from ${existingExamplesCount} to ${currentExamplesCount}. Regenerating documentation.`)
								regenerate = true
				
								// Store the previous content for reference
								sourceData.previousDocContent = existingContent
							}
						} else {
							// If no marker found, regenerate to include the marker
							// eslint-disable-next-line no-console
							console.log(` -> No examples count marker found in existing file. File will be regenerated.`)
							regenerate = true

							// Store the previous content for reference
							sourceData.previousDocContent = existingContent
						}
					} catch (error) {
						console.warn(`Error reading existing file ${outputFilePath}:`, error)
						// If we can't read the file, assume we need to regenerate
						regenerate = true
					}
				}

				if (!regenerate) {
					// eslint-disable-next-line no-console
					console.log(` -> Output file ${outputFilePath} already exists with same examples count. Skipping generation.`)
					continue // Skip to the next component
				}

				if (config.contextDir) {
					// eslint-disable-next-line no-console
					console.log(` -> Finding real-world usage examples for ${sourceData.componentName} in playground...`)

					const playgroundExamples = await playgroundFinder.findComponentExamples(
						sourceData.componentName,
						config.contextDir,
					)

					const importExamples = await playgroundFinder.findComponentImports(
						sourceData.componentName,
						config.contextDir,
					)

					if (playgroundExamples.length > 0 || importExamples.length > 0) {
						// eslint-disable-next-line no-console
						console.log(` -> Found ${playgroundExamples.length} usage examples and ${importExamples.length} import examples`)

						const originalExamplesCount = sourceData.examples?.length || 0
						sourceData.originalExamplesCount = originalExamplesCount

						const sourceExamples = [...(sourceData.examples || [])]

						sourceData.examples = sourceData.examples || []
						sourceData.examples = [...sourceData.examples, ...playgroundExamples]

						if (importExamples.length > 0) {
							sourceData.imports = importExamples
						}

						// eslint-disable-next-line no-console
						console.log(` -> Total examples count now: ${sourceData.examples.length} (${originalExamplesCount} from source + ${playgroundExamples.length} from playground)`)
					} else {
						// eslint-disable-next-line no-console
						console.log(` -> No playground examples found for ${sourceData.componentName}`)
					}
				}

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
