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

				if (outputFileExists) {
					// eslint-disable-next-line no-console
					console.log(` -> Output file ${outputFilePath} already exists. Skipping generation.`)
					continue // Skip to the next component
				}

				// Find usage examples from the playground
				if (config.contextDir) {
					// eslint-disable-next-line no-console
					console.log(` -> Finding real-world usage examples for ${sourceData.componentName} in playground...`)

					// Find component usage examples in the playground
					const playgroundExamples = await playgroundFinder.findComponentExamples(
						sourceData.componentName,
						config.contextDir,
					)

					// Find component import statements in the playground
					const importExamples = await playgroundFinder.findComponentImports(
						sourceData.componentName,
						config.contextDir,
					)

					// Add these examples to the sourceData
					if (playgroundExamples.length > 0 || importExamples.length > 0) {
						// eslint-disable-next-line no-console
						console.log(` -> Found ${playgroundExamples.length} usage examples and ${importExamples.length} import examples`)

						// Track the original examples count before adding playground examples
						const originalExamplesCount = sourceData.examples?.length || 0
						sourceData.originalExamplesCount = originalExamplesCount

						// Add playground examples to the existing examples (or create the array if it doesn't exist)
						sourceData.examples = sourceData.examples || []
						sourceData.examples = [...sourceData.examples, ...playgroundExamples]

						// Add playground import examples under a special "imports" property
						if (importExamples.length > 0) {
							sourceData.imports = importExamples
						}
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
