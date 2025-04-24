import * as path from 'path'
import { loadConfig } from './config'
import { findComponentFiles, kebabCase } from './utils'
import { generateMarkdownWithAI } from './ai'
import { writeMarkdownFile } from './writer'
import { ComponentParser } from './parser'
import { PlaygroundExampleFinder } from './playground-parser'
import { ExternalProjectExampleFinder } from './external-project-parser'
import { ExampleSourceInfo } from './types'

async function main() {
	const parser = new ComponentParser()
	const playgroundFinder = new PlaygroundExampleFinder()
	const externalFinder = new ExternalProjectExampleFinder()

	// eslint-disable-next-line no-console
	console.log('Starting documentation generation...')

	const config = loadConfig()
	// eslint-disable-next-line no-console
	console.log('Configuration loaded.')

	const componentFiles = await findComponentFiles(config.sourceDir, config.componentFilePattern)
	// eslint-disable-next-line no-console
	console.log(`Found ${componentFiles.length} component files.`)

	if (componentFiles.length === 0) {
		// eslint-disable-next-line no-console
		console.log('No component files found. Exiting.')
		return
	}

	let totalComponents = 0
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

			for (const sourceData of componentsData) {
				// eslint-disable-next-line no-console
				console.log(`\n -> Processing component: ${sourceData.componentName}`)

				processedComponents.add(sourceData.componentName)

				const outputFilePath = path.join(config.outputDir, `${kebabCase(sourceData.componentName)}.mdx`)
				const outputFileExists = await Bun.file(outputFilePath).exists()
				const originalExamplesCount = sourceData.examples?.length || 0

				sourceData.originalExamplesCount = originalExamplesCount
				sourceData.playgroundExamplesCount = 0
				sourceData.externalProjectExamplesCount = 0
				sourceData.exampleSources = sourceData.examples?.map(() => ({ source: 'jsdoc' })) || []

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
						console.log(` -> Found ${playgroundExamples.length} usage examples and ${importExamples.length} import examples in playground`)

						sourceData.examples = sourceData.examples || []

						const playgroundSourceInfos: ExampleSourceInfo[] = playgroundExamples.map(() => ({
							source: 'playground',
							projectName: 'Contember Playground',
						}))

						sourceData.examples = [...sourceData.examples, ...playgroundExamples]
						sourceData.exampleSources = [...sourceData.exampleSources, ...playgroundSourceInfos]
						sourceData.playgroundExamplesCount = playgroundExamples.length

						if (importExamples.length > 0) {
							sourceData.imports = importExamples
							sourceData.importSources = importExamples.map(() => ({
								source: 'playground',
							}))
						}

						// eslint-disable-next-line no-console
						console.log(` -> Total examples count now: ${sourceData.examples.length} (${originalExamplesCount} from source + ${playgroundExamples.length} from playground)`)
					} else {
						// eslint-disable-next-line no-console
						console.log(` -> No playground examples found for ${sourceData.componentName}`)
					}
				}

				if (config.externalProjects && config.externalProjects.length > 0) {
					// eslint-disable-next-line no-console
					console.log(` -> Finding examples for ${sourceData.componentName} in ${config.externalProjects.length} external projects...`)

					const {
						examples: externalExamples,
						sourcesInfo: externalSourcesInfo,
						imports: externalImports,
						importSources: externalImportSources,
					} = await externalFinder.findExternalExamples(
						sourceData.componentName,
						config.externalProjects,
					)

					if (externalExamples.length > 0 || externalImports.length > 0) {
						// eslint-disable-next-line no-console
						console.log(` -> Found ${externalExamples.length} usage examples and ${externalImports.length} import examples in external projects`)

						sourceData.examples = sourceData.examples || []
						sourceData.examples = [...sourceData.examples, ...externalExamples]
						sourceData.exampleSources = [...sourceData.exampleSources, ...externalSourcesInfo]
						sourceData.externalProjectExamplesCount = externalExamples.length

						if (externalImports.length > 0) {
							sourceData.imports = sourceData.imports || []
							sourceData.imports = [...sourceData.imports, ...externalImports]

							sourceData.importSources = sourceData.importSources || []
							sourceData.importSources = [...sourceData.importSources, ...externalImportSources]
						}

						// eslint-disable-next-line no-console
						console.log(` -> Total examples count now: ${sourceData.examples.length} ` +
							`(${originalExamplesCount} from source + ` +
							`${sourceData.playgroundExamplesCount} from playground + ` +
							`${sourceData.externalProjectExamplesCount} from external projects)`)
					} else {
						// eslint-disable-next-line no-console
						console.log(` -> No examples found in external projects for ${sourceData.componentName}`)
					}
				}

				let regenerate = !outputFileExists
				let existingContent: string | null = null

				if (outputFileExists && sourceData.examples) {
					try {
						existingContent = await Bun.file(outputFilePath).text()

						// eslint-disable-next-line no-console
						console.log(` -> Checking examples count markers in existing file...`)

						const totalMarker = existingContent.match(/<!-- Examples count: (\d+) -->/)
						const sourceMarker = existingContent.match(/<!-- Source examples: (\d+) -->/)
						const playgroundMarker = existingContent.match(/<!-- Playground examples: (\d+) -->/)
						const externalMarker = existingContent.match(/<!-- External examples: (\d+) -->/)
						const importsMarker = existingContent.match(/<!-- Import examples: (\d+) -->/)

						const currentSourceCount = sourceData.originalExamplesCount || 0
						const currentPlaygroundCount = sourceData.playgroundExamplesCount || 0
						const currentExternalCount = sourceData.externalProjectExamplesCount || 0
						const currentImportsCount = sourceData.imports?.length || 0
						const currentTotalCount = sourceData.examples?.length || 0

						let hasChanges = false
						let changeReason = ''

						// eslint-disable-next-line no-console
						console.log(` -> Current counts - Total: ${currentTotalCount}, Source: ${currentSourceCount}, ` +
							`Playground: ${currentPlaygroundCount}, External: ${currentExternalCount}, Imports: ${currentImportsCount}`)

						if (sourceMarker && sourceMarker[1]) {
							const existingSourceCount = parseInt(sourceMarker[1], 10)
							if (existingSourceCount !== currentSourceCount) {
								hasChanges = true
								changeReason += `source examples (${existingSourceCount}->${currentSourceCount}) `
							}
						} else {
							hasChanges = true
							changeReason += 'missing source examples marker '
						}

						if (playgroundMarker && playgroundMarker[1]) {
							const existingPlaygroundCount = parseInt(playgroundMarker[1], 10)
							if (existingPlaygroundCount !== currentPlaygroundCount) {
								hasChanges = true
								changeReason += `playground examples (${existingPlaygroundCount}->${currentPlaygroundCount}) `
							}
						} else if (currentPlaygroundCount > 0) {
							hasChanges = true
							changeReason += 'missing playground examples marker '
						}

						if (externalMarker && externalMarker[1]) {
							const existingExternalCount = parseInt(externalMarker[1], 10)
							if (existingExternalCount !== currentExternalCount) {
								hasChanges = true
								changeReason += `external examples (${existingExternalCount}->${currentExternalCount}) `
							}
						} else if (currentExternalCount > 0) {
							hasChanges = true
							changeReason += 'missing external examples marker '
						}

						if (importsMarker && importsMarker[1]) {
							const existingImportsCount = parseInt(importsMarker[1], 10)
							if (existingImportsCount !== currentImportsCount) {
								hasChanges = true
								changeReason += `imports (${existingImportsCount}->${currentImportsCount}) `
							}
						} else if (currentImportsCount > 0) {
							hasChanges = true
							changeReason += 'missing imports marker '
						}

						if (hasChanges) {
							// eslint-disable-next-line no-console
							console.log(` -> Examples counts changed: ${changeReason}. Regenerating documentation.`)
							regenerate = true
							sourceData.previousDocContent = existingContent
						} else if (!totalMarker || !sourceMarker ||
								  (currentPlaygroundCount > 0 && !playgroundMarker) ||
								  (currentExternalCount > 0 && !externalMarker)) {
							// eslint-disable-next-line no-console
							console.log(` -> Missing required example count markers in existing file. File will be regenerated.`)
							regenerate = true
							sourceData.previousDocContent = existingContent
						} else {
							// eslint-disable-next-line no-console
							console.log(` -> All example counts match. No changes needed.`)
						}
					} catch (error) {
						console.warn(`Error reading existing file ${outputFilePath}:`, error)
						regenerate = true
					}
				}

				if (!regenerate) {
					// eslint-disable-next-line no-console
					console.log(` -> Output file ${outputFilePath} already exists with same examples count. Skipping generation.`)
					continue
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
		}
	}

	// eslint-disable-next-line no-console
	console.log(`\nDocumentation generation finished. Processed ${totalComponents} components from ${componentFiles.length} files.`)
}

main().catch(error => {
	console.error('Unhandled error during script execution:', error)
	process.exit(1)
})
