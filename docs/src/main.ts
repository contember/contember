import * as path from 'path'
import { loadConfig } from './config'
import { findComponentFiles, kebabCase } from './utils'
import { generateMarkdownWithAI, prepareComponentGroupForAI } from './ai'
import { writeMarkdownFile } from './writer'
import { ComponentParser } from './parser'
import { PlaygroundExampleFinder } from './playground-parser'
import { ExternalProjectExampleFinder } from './external-project-parser'
import { ComponentSourceData, ExampleSourceInfo } from './types'

const parsePropsFromApiExtractor = (propsString: string): any[] => {
	const propsLines = propsString.split('\n').map(line => line.trim()).filter(Boolean)
	const props = []

	for (const line of propsLines) {
		const propMatch = line.match(/(\w+)(\?)?:\s*([^;]+);/)
		if (propMatch) {
			const [, name, optional, type] = propMatch
			props.push({
				name,
				type: type.trim(),
				required: !optional ? 'Yes' : 'No',
				default: optional ? '–' : undefined,
				description: '',
			})
		}
	}

	return props
}

const generatePropsTable = (props: any[]): string => {
	let table = '| Name | Type | Required | Default | Description |\n'
	table += '|------|------|----------|---------|-------------|\n'

	for (const prop of props) {
		table += `| ${prop.name} | ${prop.type} | ${prop.required} | ${prop.default || '–'} | ${prop.description || ''} |\n`
	}

	return table
}

const enhanceDocumentationWithApiData = async (markdownContent: string, componentName: string, isGroup = false, groupComponents: string[] = []): Promise<string> => {
	try {
		// Create array of components to process - just the main one if not a group
		const componentsToProcess = isGroup ? [componentName, ...groupComponents] : [componentName]
		let updatedMarkdown = markdownContent

		const apiFilePath = path.join(process.cwd(), '../build/api/ui-lib-select.api.md')
		const apiFileContent = await Bun.file(apiFilePath).text()

		// Process each component
		for (const component of componentsToProcess) {
			const propsTypeRegex = new RegExp(`export type ${component}Props = \\{([^\\}]+)\\};`)
			const propsTypeMatch = apiFileContent.match(propsTypeRegex)

			if (!propsTypeMatch) continue

			const propsData = parsePropsFromApiExtractor(propsTypeMatch[1])
			const propsTable = generatePropsTable(propsData)

			// Different replacement patterns depending on if it's the main component or a subcomponent
			let propsReferenceRegex = new RegExp(`<!-- props${component === componentName ? '' : `:${component}`} -->`)
			updatedMarkdown = updatedMarkdown.replace(propsReferenceRegex, propsTable)
		}

		// Add note about API data enhancement
		return updatedMarkdown + '\n\n> **Note:** Props reference has been automatically enhanced with precise API types from API Extractor.\n'
	} catch (error) {
		console.error(`Error enhancing documentation with API data:`, error)
		return markdownContent
	}
}

/**
 * Organizes components into groups based on @group tags and sub-component relationships
 *
 * @returns Map of group name to main component data and list of related components
 */
function organizeComponentGroups(componentsData: ComponentSourceData[]): Map<string, {
	mainComponent: ComponentSourceData
	relatedComponents: ComponentSourceData[]
}> {
	// Filter out internal components that shouldn't be documented separately
	const documentableComponents = componentsData.filter(component => !component.isInternal)
	const allComponentMap = new Map<string, ComponentSourceData>()

	// Map all components (including internal) for reference
	componentsData.forEach(component => {
		allComponentMap.set(component.componentName, component)
	})

	const groups = new Map<string, {
		mainComponent: ComponentSourceData
		relatedComponents: ComponentSourceData[]
	}>()

	// Map of component names to their group names for quick lookups
	const componentGroupMap = new Map<string, string>()
	const ungrouped = new Set<ComponentSourceData>()

	// First pass: Find main components and create groups
	documentableComponents.forEach(component => {
		// Assign components with group tags to their groups
		if (component.groupName) {
			// If this is a main component, make it the group leader
			if (component.isMainComponent) {
				if (!groups.has(component.groupName)) {
					groups.set(component.groupName, {
						mainComponent: component,
						relatedComponents: [],
					})
				} else {
					// If the group already exists but doesn't have a main component yet
					const group = groups.get(component.groupName)!
					if (!group.mainComponent.isMainComponent) {
						// Replace existing placeholder with this main component
						const existingComponents = group.relatedComponents
						groups.set(component.groupName, {
							mainComponent: component,
							relatedComponents: [...existingComponents, group.mainComponent],
						})
					} else {
						// Add to related components if there's already a main component
						group.relatedComponents.push(component)
					}
				}
			} else {
				// Check if group exists
				if (!groups.has(component.groupName)) {
					// Create group with placeholder (first component as temporary main)
					groups.set(component.groupName, {
						mainComponent: component,
						relatedComponents: [],
					})
				} else {
					// Add to existing group as related component
					const group = groups.get(component.groupName)!
					group.relatedComponents.push(component)
				}
			}

			// Map this component to its group
			componentGroupMap.set(component.componentName, component.groupName)
		} else if (component.isMainComponent) {
			groups.set(component.componentName, {
				mainComponent: component,
				relatedComponents: [],
			})
			componentGroupMap.set(component.componentName, component.componentName)
		} else {
			ungrouped.add(component)
		}
	})

	// Second pass: Process sub-components and hooks from main components
	documentableComponents.forEach(component => {
		if (component.isMainComponent) {
			const groupName = component.groupName || component.componentName
			const group = groups.get(groupName)!

			// Process sub-components
			if (component.subComponents) {
				component.subComponents.forEach(subComponentName => {
					const subComponent = allComponentMap.get(subComponentName)

					if (subComponent) {
						// If not internal, check if it's in ungrouped
						if (!subComponent.isInternal && ungrouped.has(subComponent)) {
							// Set the group name explicitly for documentable sub-components
							subComponent.groupName = groupName
							componentGroupMap.set(subComponent.componentName, groupName)

							ungrouped.delete(subComponent)
							group.relatedComponents.push(subComponent)
						}
					}
				})
			}

			// Process hooks
			if (component.hooks) {
				component.hooks.forEach(hookName => {
					const hook = allComponentMap.get(hookName)

					if (hook && !hook.isInternal && ungrouped.has(hook)) {
						// Set the group name explicitly
						hook.groupName = groupName
						componentGroupMap.set(hook.componentName, groupName)

						ungrouped.delete(hook)
						group.relatedComponents.push(hook)
					}
				})
			}
		}
	})

	// Add remaining ungrouped components as individual entries
	ungrouped.forEach(component => {
		groups.set(component.componentName, {
			mainComponent: component,
			relatedComponents: [],
		})
	})

	return groups
}

/**
 * Collects all components in a group (including internal) for a comprehensive AI prompt
 */
async function collectAllGroupComponents(
	mainComponent: ComponentSourceData,
	relatedComponents: ComponentSourceData[],
	allComponentsData: ComponentSourceData[],
): Promise<{
	mainComponent: ComponentSourceData
	relatedComponents: ComponentSourceData[]
	internalComponents: ComponentSourceData[]
}> {
	const internalComponents: ComponentSourceData[] = []

	// Check for internal components referenced by the main component
	if (mainComponent.subComponents || mainComponent.hooks) {
		const allReferences = [
			...(mainComponent.subComponents || []),
			...(mainComponent.hooks || []),
		]

		for (const componentName of allReferences) {
			const component = allComponentsData.find(c => c.componentName === componentName && c.isInternal)
			if (component) {
				internalComponents.push(component)
			}
		}
	}

	// Also check if any related components reference internal components
	for (const relatedComponent of relatedComponents) {
		if (relatedComponent.subComponents) {
			for (const componentName of relatedComponent.subComponents) {
				const component = allComponentsData.find(c =>
					c.componentName === componentName &&
					c.isInternal &&
					!internalComponents.some(ic => ic.componentName === componentName),
				)
				if (component) {
					internalComponents.push(component)
				}
			}
		}
	}

	return { mainComponent, relatedComponents, internalComponents }
}

/**
 * Process examples for a component from playground and external projects
 */
async function processComponentExamples(
	component: ComponentSourceData,
	config: any,
	playgroundFinder: PlaygroundExampleFinder,
	externalFinder: ExternalProjectExampleFinder,
): Promise<ComponentSourceData> {
	const originalExamplesCount = component.examples?.length || 0
	component.originalExamplesCount = originalExamplesCount
	component.playgroundExamplesCount = 0
	component.externalProjectExamplesCount = 0
	component.exampleSources = component.examples?.map(() => ({ source: 'jsdoc' })) || []

	// Search for examples in playground
	if (config.contextDir) {
		// eslint-disable-next-line no-console
		console.log(` -> Finding examples for ${component.componentName} in playground...`)

		const playgroundExamples = await playgroundFinder.findComponentExamples(
			component.componentName,
			config.contextDir,
		)

		const importExamples = await playgroundFinder.findComponentImports(
			component.componentName,
			config.contextDir,
		)

		if (playgroundExamples.length > 0 || importExamples.length > 0) {
			// eslint-disable-next-line no-console
			console.log(` -> Found ${playgroundExamples.length} usage examples and ${importExamples.length} import examples in playground`)

			component.examples = component.examples || []

			const playgroundSourceInfos: ExampleSourceInfo[] = playgroundExamples.map(() => ({
				source: 'playground',
				projectName: 'Contember Playground',
			}))

			component.examples = [...component.examples, ...playgroundExamples]
			component.exampleSources = [...component.exampleSources, ...playgroundSourceInfos]
			component.playgroundExamplesCount = playgroundExamples.length

			if (importExamples.length > 0) {
				component.imports = importExamples
				component.importSources = importExamples.map(() => ({
					source: 'playground',
				}))
			}

			// eslint-disable-next-line no-console
			console.log(` -> Total examples for ${component.componentName}: ${component.examples.length} ` +
				`(${originalExamplesCount} from source + ${playgroundExamples.length} from playground)`)
		}
	}

	// Search for examples in external projects
	if (config.externalProjects && config.externalProjects.length > 0) {
		// eslint-disable-next-line no-console
		console.log(` -> Finding examples for ${component.componentName} in external projects...`)

		const {
			examples: externalExamples,
			sourcesInfo: externalSourcesInfo,
			imports: externalImports,
			importSources: externalImportSources,
		} = await externalFinder.findExternalExamples(
			component.componentName,
			config.externalProjects,
		)

		if (externalExamples.length > 0 || externalImports.length > 0) {
			// eslint-disable-next-line no-console
			console.log(` -> Found ${externalExamples.length} usage examples and ${externalImports.length} import examples in external projects`)

			component.examples = component.examples || []
			component.examples = [...component.examples, ...externalExamples]
			component.exampleSources = [...component.exampleSources, ...externalSourcesInfo]
			component.externalProjectExamplesCount = externalExamples.length

			if (externalImports.length > 0) {
				component.imports = component.imports || []
				component.imports = [...component.imports, ...externalImports]

				component.importSources = component.importSources || []
				component.importSources = [...component.importSources, ...externalImportSources]
			}

			// eslint-disable-next-line no-console
			console.log(` -> Total examples for ${component.componentName}: ${component.examples.length} ` +
				`(${originalExamplesCount} from source + ` +
				`${component.playgroundExamplesCount} from playground + ` +
				`${component.externalProjectExamplesCount} from external projects)`)
		}
	}

	return component
}

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
	const allComponentsData: ComponentSourceData[] = []

	// First pass: Parse all component files and collect component data
	for (const filePath of componentFiles) {
		// eslint-disable-next-line no-console
		console.log(`\nReading file: ${filePath}`)

		try {
			const componentsData = await parser.parseComponentSource(filePath, processedComponents)

			if (componentsData.length === 0) {
				console.warn(`No components found in ${filePath}. Skipping.`)
				continue
			}

			totalComponents += componentsData.length
			// eslint-disable-next-line no-console
			console.log(` -> Found ${componentsData.length} component(s) in file. [${componentsData.map(c => c.componentName).join(', ')}]`)

			// Add to all components data
			allComponentsData.push(...componentsData)

			// Mark components as processed
			componentsData.forEach(component => {
				processedComponents.add(component.componentName)
			})
		} catch (error) {
			console.error(`Error reading file ${filePath}:`, error)
		}
	}

	// Organize components into logical groups
	const componentGroups = organizeComponentGroups(allComponentsData)

	// eslint-disable-next-line no-console
	console.log(`\nOrganized ${totalComponents} components into ${componentGroups.size} groups.`)

	// Process each group and generate a single documentation page for the group
	for (const [groupName, group] of Array.from(componentGroups)) {
		// eslint-disable-next-line no-console
		console.log(`\nProcessing component group: ${groupName}`)

		// Get all components in the group, including internal ones
		const { mainComponent, relatedComponents, internalComponents } =
			await collectAllGroupComponents(group.mainComponent, group.relatedComponents, allComponentsData)

		// Skip if the main component is excluded
		if (config.excludeComponents?.includes(mainComponent.componentName)) {
			console.warn(`Main component ${mainComponent.componentName} is excluded from documentation.`)
			continue
		}

		// Generate output file path - only one file per group
		const outputFilePath = path.join(config.outputDir, `${kebabCase(mainComponent.componentName)}.mdx`)
		const outputFileExists = await Bun.file(outputFilePath).exists()

		// eslint-disable-next-line no-console
		console.log(`\n -> Group contains: main=${mainComponent.componentName}, related=${relatedComponents.length}, internal=${internalComponents.length}`)

		// Process examples for main component
		// eslint-disable-next-line no-console
		console.log(`\n -> Processing examples for main component: ${mainComponent.componentName}`)
		await processComponentExamples(mainComponent, config, playgroundFinder, externalFinder)

		// Process examples for all related components
		for (const relatedComponent of [...relatedComponents, ...internalComponents]) {
			// eslint-disable-next-line no-console
			console.log(`\n -> Processing examples for component: ${relatedComponent.componentName}`)
			await processComponentExamples(relatedComponent, config, playgroundFinder, externalFinder)
		}

		let regenerate = !outputFileExists
		let existingContent: string | null = null

		// Check if we need to regenerate based on existing file
		if (outputFileExists) {
			try {
				existingContent = await Bun.file(outputFilePath).text()
				// eslint-disable-next-line no-console
				console.log(` -> Checking existing documentation file...`)

				// For simplicity, we'll regenerate if any file exists
				// In a real implementation, you might want to check for specific changes
				regenerate = true
				mainComponent.previousDocContent = existingContent
			} catch (error) {
				console.warn(`Error reading existing file ${outputFilePath}:`, error)
				regenerate = true
			}
		}

		if (!regenerate) {
			// eslint-disable-next-line no-console
			console.log(` -> Output file ${outputFilePath} already exists and no changes detected. Skipping generation.`)
			continue
		}

		// eslint-disable-next-line no-console
		console.log(` -> Preparing group data for AI documentation generation...`)

		// Prepare component group data for AI
		const groupData = await prepareComponentGroupForAI(
			mainComponent,
			relatedComponents,
			internalComponents,
		)

		// eslint-disable-next-line no-console
		console.log(` -> Generating documentation for component group with AI...`)

		// Generate documentation for the entire group
		const markdownContent = await generateMarkdownWithAI(
			groupData,
			config.overrides?.[mainComponent.componentName],
			config.ai,
		)

		if (!markdownContent) {
			console.warn(` -> AI generation failed for ${mainComponent.componentName} group. Skipping.`)
			continue
		}

		// eslint-disable-next-line no-console
		console.log(` -> AI generation successful for ${mainComponent.componentName} group.`)

		// Get all component names in the group for API data enhancement
		const allComponentNames = [
			...relatedComponents.map(c => c.componentName),
			...internalComponents.map(c => c.componentName),
		]

		// Enhance documentation with API data for all components in the group
		const enhancedMarkdown = await enhanceDocumentationWithApiData(
			markdownContent,
			mainComponent.componentName,
			true, // This is a group
			allComponentNames,
		)

		// Write the final documentation file
		await writeMarkdownFile(outputFilePath, enhancedMarkdown)

		// eslint-disable-next-line no-console
		console.log(` -> Documentation for group ${groupName} written to ${outputFilePath}`)
	}

	// eslint-disable-next-line no-console
	console.log(`\nDocumentation generation finished. Processed ${totalComponents} components into ${componentGroups.size} documentation files.`)
}

main().catch(error => {
	console.error('Unhandled error during script execution:', error)
	process.exit(1)
})
