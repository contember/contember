import * as fs from 'fs'
import OpenAI from 'openai'
import * as path from 'path'
import type { AIPromptData, ComponentOverride, DocsConfig, PropData } from './types'

const openai = new OpenAI()

/**
 * Reads and parses API extractor data for a component
 */
function getApiExtractorData(componentName: string): Record<string, PropData> | null {
	try {
		// Find the matching .api.json file
		const apiDir = path.join(process.cwd(), '..', 'build', 'api')
		const files = fs.readdirSync(apiDir)

		// Look for ui-lib files first, then fall back to others
		const apiFiles = files.filter(f => f.endsWith('.api.json'))

		// Try to find the component in all API files
		for (const apiFile of apiFiles) {
			const apiData = JSON.parse(fs.readFileSync(path.join(apiDir, apiFile), 'utf-8'))

			// First, look for the Props interface
			const propsInterface = apiData.members?.[0]?.members?.find((m: any) =>
				m.kind === 'Interface' && m.name === `${componentName}Props`,
			)

			if (propsInterface) {
				const props: Record<string, PropData> = {}

				// Extract props from the interface
				propsInterface.members?.forEach((member: any) => {
					if (member.kind === 'PropertySignature') {
						const name = member.name
						const type = member.excerptTokens
							.slice(member.propertyTypeTokenRange.startIndex, member.propertyTypeTokenRange.endIndex)
							.map((t: any) => t.text)
							.join('')
							.trim()

						props[name] = {
							name,
							type,
							description: member.docComment || '',
							required: !member.excerptTokens.some((t: any) => t.text.includes('?')),
						}
					}
				})

				return props
			}

			// If no Props interface, look for the component itself
			const component = apiData.members?.[0]?.members?.find((m: any) => m.name === componentName)

			if (component) {
				// For components defined as variables with inline types
				if (component.kind === 'Variable' && component.variableTypeTokenRange) {
					const typeTokens = component.excerptTokens.slice(
						component.variableTypeTokenRange.startIndex,
						component.variableTypeTokenRange.endIndex,
					)

					// Extract props from the inline type
					const props: Record<string, PropData> = {}
					let objectTypeLevel = 0
					let objectTypeBuffer = ''
					let inObjectType = false

					typeTokens.forEach((token: any) => {
						if (token.kind === 'Content' || token.kind === 'Reference') {
							const text = token.text
							if (text === '{') {
								objectTypeLevel++
								inObjectType = true
							}
							if (inObjectType) {
								objectTypeBuffer += text
							}
							if (text === '}') {
								objectTypeLevel--
								if (objectTypeLevel === 0) {
									inObjectType = false
									// Now parse the objectTypeBuffer for props
									const propLines = objectTypeBuffer
										.replace(/^{|}$/g, '')
										.split(/;|\n/)
										.map(l => l.trim())
										.filter(Boolean)
									for (const line of propLines) {
										// Match: name?: type or name: type
										const match = line.match(/^(\w+)(\?)?:\s*(.+)$/)
										if (match) {
											const [, name, optional, type] = match
											props[name] = {
												name,
												type: type.trim(),
												description: '',
												required: !optional,
											}
										}
									}
									objectTypeBuffer = ''
								}
							}
						}
					})

					// Add common HTML attributes if no props were found
					if (Object.keys(props).length === 0) {
						props.asChild = {
							name: 'asChild',
							type: 'boolean',
							description: 'Whether to render as a child component',
							required: false,
						}
						props.children = {
							name: 'children',
							type: 'ReactNode',
							description: 'The content to render',
							required: false,
						}
						props.className = {
							name: 'className',
							type: 'string',
							description: 'Additional CSS class name',
							required: false,
						}
						props.style = {
							name: 'style',
							type: 'CSSProperties',
							description: 'Inline styles',
							required: false,
						}
						props.id = {
							name: 'id',
							type: 'string',
							description: 'HTML id attribute',
							required: false,
						}
						props['aria-label'] = {
							name: 'aria-label',
							type: 'string',
							description: 'ARIA label for accessibility',
							required: false,
						}
					}

					return props
				}
			}
		}

		console.warn(`Component ${componentName} not found in API data`)
		return null
	} catch (error) {
		console.error(`Error reading API extractor data for ${componentName}:`, error)
		return null
	}
}

/**
 * Extracts props from a type definition
 */
function extractPropsFromTypeDef(typeDef: any): Record<string, PropData> {
	const props: Record<string, PropData> = {}

	typeDef.members?.forEach((prop: any) => {
		if (prop.kind === 'PropertySignature' || prop.kind === 'Property') {
			const description = prop.docComment?.split('\n')
				.filter((line: string) => !line.startsWith('@'))
				.join('\n')
				.trim()

			props[prop.name] = {
				name: prop.name,
				type: prop.excerptTokens
					?.filter((t: any) => t.kind === 'Content')
					.map((t: any) => t.text)
					.join('')
					.trim(),
				description,
				required: !prop.isOptional,
				defaultValue: prop.docComment?.match(/@defaultValue\s+(.+)/)?.[1]?.trim(),
			}
		}
	})

	return props
}

export const buildPrompt = (data: AIPromptData, override?: ComponentOverride): string => {
	const lines: string[] = []

	// Check if we're generating documentation for a component group
	if (data.isComponentGroup) {
		lines.push(`You are an **expert technical writer** creating Docusaurus pages for Contember React components.

**Follow _every_ numbered instruction exactly** and respond **only** with valid Markdown.

### 1. Document Structure for Component Group
1. **Overview** – 1-2 concise paragraphs about the main component (from JSDoc)
2. **Core Concepts** – Bullet list of ideas the reader must grasp for the entire component group.
3. **Installation** – How to import the main component and its subcomponents.
4. **Quick Start** – Smallest functional example using main component and essential subcomponents.
5. **Detailed Guide** – Walkthrough showing how main component works with its subcomponents.
6. **Component API Reference** – For each component in the group:
   - **Main Component (${data.componentName})** – Full component documentation
     - Place <!-- props --> placeholder after props heading for main component
   - **Sub-Components** – Each with its own section
     - For each subcomponent, include a \`### {ComponentName}\` heading
     - Brief description of purpose and functionality
     - Place <!-- props:{ComponentName} --> placeholder after each subcomponent's props heading
7. **Hooks** – If applicable, document each hook with its own section
8. **Examples** – Real-world scenarios showing the component group working together.
9. **Best Practices & Gotchas** – Bullet list for the entire component family.
10. **Further Reading** – Related components / concepts.`)
	} else {
		lines.push(`You are an **expert technical writer** creating Docusaurus pages for Contember React components.

**Follow _every_ numbered instruction exactly** and respond **only** with valid Markdown.

### 1. Document Structure
1. **Overview** – 1-2 concise paragraphs (from JSDoc)
3. **Core Concepts** – Bullet list of ideas the reader must grasp.
4. **Quick Start** – Smallest functional example (Tailwind classes included).
5. **Detailed Guide** *(optional)* – Walkthrough with multiple snippets.
6. **Props Reference** – Place <!-- props --> placeholder to mark where to insert autogenerated props reference.
7. **Sub-Components / Building Blocks** – Filters, Triggers, Hooks, etc. Give each its own \`### <n>\` heading.
8. **Examples** – Focused, real-world scenarios with explanations under each code block.
9. **Best Practices & Gotchas** – Bullet list.
10. **Further Reading** – Related components / concepts.`)
	}

	lines.push(`
### 2. Writing Style
* Use active voice and second person ("you").
* Keep sentences < 24 words.
* Prefer bullet lists over long paragraphs.
* Code fences: \` \`\`\`tsx \`\`\` for TS/JSX, \` \`\`\`bash \`\`\` for CLI.
* Insert Tailwind classes directly in JSX (e.g. \`className="flex gap-2"\`).
* Don't name examples after projects. It should be project agnostic.

### 3. Output Rules
* **Do not** invent props or examples that are not present in the source data.
* If a section has no content, skip it.
* End the document with \`<!-- End of Generated Documentation -->\`.

--- Source Data ---\n`)

	// Main component info
	lines.push(`## Component\n${data.componentName}\n`)
	lines.push(
		`## Description (from JSDoc)\n${data.jsdoc ?? '_No JSDoc description provided._'
		}\n`,
	)

	// For component groups, add information about all components in the group
	if (data.isComponentGroup && data.groupComponents) {
		lines.push(`## Component Group Structure\n`)
		lines.push(`This documentation covers a group of related components:\n`)

		// List all components in the group
		data.groupComponents.forEach(comp => {
			const role = comp.isMainComponent ? 'Main Component' : 'Subcomponent'
			lines.push(`- ${comp.componentName} (${role})`)
		})
		lines.push('')

		// Add detailed information for each component in the group
		lines.push(`## Detailed Components Information\n`)

		data.groupComponents.forEach(comp => {
			lines.push(`### ${comp.componentName}\n`)

			// Component description
			lines.push(`#### Description\n${comp.jsdoc ?? '_No description provided._'}\n`)

			// Component props
			if (comp.props && Object.keys(comp.props).length) {
				lines.push(`#### Props\n`)
				lines.push('```json')
				lines.push(JSON.stringify(comp.props, null, 2))
				lines.push('```\n')
			}

			// Component examples
			if (comp.examples && comp.examples.length) {
				lines.push(`#### Examples\n`)
				comp.examples.forEach(example => {
					lines.push(example)
					lines.push('')
				})
			}
		})
	} else {
		// Standard single component props
		lines.push(`## API Props (from Type Analysis)`)
		if (data.props && Object.keys(data.props).length) {
			lines.push('```json')
			lines.push(JSON.stringify(data.props, null, 2))
			lines.push('```')
		} else {
			lines.push('_No props definition found._')
		}
		lines.push('')
	}

	// Include examples for all components
	lines.push(`## Examples (${data.examples?.length || 0} total)`)
	if (data.examples && data.examples.length) {
		data.examples.forEach((example, i) => {
			const sourceInfo = data.exampleSources?.[i]
			const sourceComment = sourceInfo
				? `\nSource: ${sourceInfo.source}${sourceInfo.projectName ? ` (${sourceInfo.projectName})` : ''}`
				: ''

			lines.push(`\n### Example ${i + 1}${sourceComment}\n`)
			lines.push(example)
		})
	} else {
		lines.push('\n_No examples available._')
	}

	lines.push('')

	// Include imports if available
	if (data.imports && data.imports.length) {
		lines.push(`## Import Examples (${data.imports.length} total)`)
		data.imports.forEach((importStatement, i) => {
			const sourceInfo = data.importSources?.[i]
			const sourceComment = sourceInfo
				? `\nSource: ${sourceInfo.source}`
				: ''

			lines.push(`\n### Import ${i + 1}${sourceComment}\n`)
			lines.push('```tsx')
			lines.push(importStatement)
			lines.push('```')
		})
		lines.push('')
	}

	// Additional context about example counts for regeneration
	if (data.originalExamplesCount !== undefined) {
		lines.push('\n## Examples Count Metadata')
		lines.push(
			`<!-- Examples count: ${data.examples?.length || 0} -->
<!-- Source examples: ${data.originalExamplesCount} -->
${data.playgroundExamplesCount ? `<!-- Playground examples: ${data.playgroundExamplesCount} -->` : ''}
${data.externalProjectExamplesCount ? `<!-- External examples: ${data.externalProjectExamplesCount} -->` : ''}
${data.imports?.length ? `<!-- Import examples: ${data.imports.length} -->` : ''}`,
		)
	}

	// If we are regenerating existing content, provide context about changes
	if (data.regenerationReason?.isUpdate) {
		const reason = data.regenerationReason
		lines.push('\n## Update Context')

		if (reason.sourceExamplesChanged) {
			lines.push(`- Source examples changed: ${reason.previousSourceCount} → ${reason.sourceExamplesCount}`)
		}

		if (reason.playgroundExamplesChanged) {
			lines.push(`- Playground examples changed: ${reason.previousPlaygroundCount} → ${reason.playgroundExamplesCount}`)
		}

		if (reason.externalExamplesChanged) {
			lines.push(`- External examples changed: ${reason.previousExternalCount} → ${reason.externalExamplesCount}`)
		}

		if (reason.importsChanged) {
			lines.push(`- Import examples changed: ${reason.previousImportsCount} → ${reason.importsCount}`)
		}

		lines.push(`\nTotal examples: ${reason.previousTotalCount} → ${reason.totalExamplesCount}`)

		if (data.previousDocContent) {
			lines.push('\n## Previous Documentation Content')
			lines.push('```markdown')
			// Limit the previous content to avoid making the prompt too large
			lines.push(data.previousDocContent.substring(0, 4000) + (data.previousDocContent.length > 4000 ? '...' : ''))
			lines.push('```')
		}
	}

	// Add notes from override if available
	if (override?.notes) {
		lines.push('\n## Additional notes from config')
		lines.push(override.notes)
	}

	return lines.join('\n')
}

/**
 * Prepares and combines data from a main component and its related components
 * to generate comprehensive documentation for the entire group
 */
export async function prepareComponentGroupForAI(
	mainComponent: AIPromptData,
	relatedComponents: AIPromptData[],
	internalComponents: AIPromptData[] = [],
): Promise<AIPromptData> {
	// Start with the main component data
	const groupData: AIPromptData = {
		...mainComponent,
		// Add special fields for group documentation
		isComponentGroup: true,
		groupComponents: [
			// Include the main component first
			{
				componentName: mainComponent.componentName,
				jsdoc: mainComponent.jsdoc,
				props: mainComponent.props,
				examples: mainComponent.examples,
				isMainComponent: true,
				exampleSources: mainComponent.exampleSources,
			},
			// Then include all related components (both public and internal)
			...relatedComponents.map(comp => ({
				componentName: comp.componentName,
				jsdoc: comp.jsdoc,
				props: comp.props,
				examples: comp.examples,
				exampleSources: comp.exampleSources,
			})),
			...internalComponents.map(comp => ({
				componentName: comp.componentName,
				jsdoc: comp.jsdoc,
				props: comp.props,
				examples: comp.examples,
				exampleSources: comp.exampleSources,
				isInternal: true,
			})),
		],
	}

	// Combine examples from all components
	const allExamples: string[] = []
	const allExampleSources: any[] = []

	// Add main component examples
	if (mainComponent.examples?.length) {
		allExamples.push(...mainComponent.examples)
		if (mainComponent.exampleSources) {
			allExampleSources.push(...mainComponent.exampleSources)
		}
	}

	// Add related components examples
	for (const comp of [...relatedComponents, ...internalComponents]) {
		if (comp.examples?.length) {
			allExamples.push(...comp.examples)
			if (comp.exampleSources) {
				allExampleSources.push(...comp.exampleSources)
			}
		}
	}

	// Update the group data with combined examples
	groupData.examples = allExamples
	groupData.exampleSources = allExampleSources

	// Update example counts
	groupData.originalExamplesCount = mainComponent.originalExamplesCount || 0
	groupData.playgroundExamplesCount = mainComponent.playgroundExamplesCount || 0
	groupData.externalProjectExamplesCount = mainComponent.externalProjectExamplesCount || 0

	// Add additional counts from related components
	for (const comp of [...relatedComponents, ...internalComponents]) {
		groupData.originalExamplesCount += comp.originalExamplesCount || 0
		groupData.playgroundExamplesCount += comp.playgroundExamplesCount || 0
		groupData.externalProjectExamplesCount += comp.externalProjectExamplesCount || 0
	}

	return groupData
}

export async function generateMarkdownWithAI(
	sourceData: AIPromptData,
	override?: ComponentOverride,
	aiConfig?: DocsConfig['ai'],
): Promise<string | null> {
	// Add regeneration reason if updating existing doc
	if (sourceData.previousDocContent) {
		// Calculate what changed to provide context to the AI
		const sourceExamplesCount = sourceData.originalExamplesCount || 0
		const playgroundExamplesCount = sourceData.playgroundExamplesCount || 0
		const externalExamplesCount = sourceData.externalProjectExamplesCount || 0
		const totalExamplesCount = sourceData.examples?.length || 0
		const importsCount = sourceData.imports?.length || 0

		// Extract previous counts from the document if possible
		const sourceRegex = /<!-- Source examples: (\d+) -->/
		const playgroundRegex = /<!-- Playground examples: (\d+) -->/
		const externalRegex = /<!-- External examples: (\d+) -->/
		const importsRegex = /<!-- Import examples: (\d+) -->/

		const previousSourceMatch = sourceData.previousDocContent.match(sourceRegex)
		const previousSourceCount = previousSourceMatch ? parseInt(previousSourceMatch[1], 10) : 0

		const previousPlaygroundMatch = sourceData.previousDocContent.match(playgroundRegex)
		const previousPlaygroundCount = previousPlaygroundMatch ? parseInt(previousPlaygroundMatch[1], 10) : 0

		const previousExternalMatch = sourceData.previousDocContent.match(externalRegex)
		const previousExternalCount = previousExternalMatch ? parseInt(previousExternalMatch[1], 10) : 0

		const previousImportsMatch = sourceData.previousDocContent.match(importsRegex)
		const previousImportsCount = previousImportsMatch ? parseInt(previousImportsMatch[1], 10) : 0

		// Create a detailed reason object
		sourceData.regenerationReason = {
			isUpdate: true,

			sourceExamplesCount,
			previousSourceCount,
			sourceExamplesChanged: sourceExamplesCount !== previousSourceCount,

			playgroundExamplesCount,
			previousPlaygroundCount,
			playgroundExamplesChanged: playgroundExamplesCount !== previousPlaygroundCount,

			externalExamplesCount,
			previousExternalCount,
			externalExamplesChanged: externalExamplesCount !== previousExternalCount,

			importsCount,
			previousImportsCount,
			importsChanged: importsCount !== previousImportsCount,

			totalExamplesCount,
			previousTotalCount: previousSourceCount + previousPlaygroundCount + previousExternalCount,
			hasNewImports: importsCount > previousImportsCount,
			hasNewExternalExamples: externalExamplesCount > previousExternalCount,
		}
	}

	const prompt = buildPrompt(sourceData, override)

	try {
		// eslint-disable-next-line no-console
		console.log(`Sending ${Math.round(prompt.length / 1024)}KB prompt to OpenAI API...`)

		const response = await openai.chat.completions.create({
			model: aiConfig?.model || 'gpt-4',
			messages: [
				{
					role: 'system',
					content:
						'You are an expert React developer and technical writer creating component documentation.',
				},
				{
					role: 'user',
					content: prompt,
				},
			],
		})

		const result = response.choices[0].message.content

		if (!result) {
			throw new Error('No response from OpenAI')
		}

		// eslint-disable-next-line no-console
		console.log(
			`AI response received (${Math.round(result.length / 1024)}KB). Token usage: ${response.usage?.total_tokens || 'unknown'
			}`,
		)

		// Process the generated documentation to add props tables
		const processedContent = processPropsDocumentation(result, sourceData)

		return processedContent
	} catch (error) {
		console.error('Error generating component documentation with AI:', error)
		return null
	}
}

/**
 * Processes the generated documentation to add props tables
 */
export function processPropsDocumentation(content: string, data: AIPromptData): string {
	let processedContent = content

	// For component groups, we need to handle multiple components
	if (data.isComponentGroup && data.groupComponents) {
		// Process each component's props
		data.groupComponents.forEach(comp => {
			// Try to get props from API extractor
			const apiProps = getApiExtractorData(comp.componentName)
			if (apiProps) {
				const propsTable = generatePropsTable(apiProps, comp.componentName)

				// Replace the placeholder for this component
				const placeholder = comp.isMainComponent ? '<!-- props -->' : `<!-- props:${comp.componentName} -->`
				processedContent = processedContent.replace(placeholder, propsTable)
			} else {
				console.warn(`No props found for component ${comp.componentName}`)
			}
		})
	} else {
		// For single components, try to get props from API extractor
		const apiProps = getApiExtractorData(data.componentName)
		if (apiProps) {
			const propsTable = generatePropsTable(apiProps, data.componentName)
			processedContent = processedContent.replace('<!-- props -->', propsTable)
		} else {
			console.warn(`No props found for component ${data.componentName}`)
		}
	}

	return processedContent
}

/**
 * Generates a props table in markdown format using API extractor data
 */
function generatePropsTable(props: Record<string, PropData>, componentName: string): string {
	const lines: string[] = []

	// Add table header
	lines.push('| Name | Type | Required | Description |')
	lines.push('|------|------|----------|-------------|')

	// Add each prop as a row
	Object.entries(props).forEach(([propName, propData]) => {
		const type = propData.type || 'any'
		const description = propData.description || ''
		const required = propData.required ? 'Yes' : 'No'
		const defaultValue = propData.defaultValue ? `Default: \`${propData.defaultValue}\`` : ''

		// Clean up the type string
		const cleanType = type
			.replace(/\s+/g, ' ')
			.replace(/\["([^"]+)"\]/g, '["$1"]')
			.trim()

		// Combine all descriptions
		const fullDescription = [description, defaultValue]
			.filter(Boolean)
			.join(' ')

		lines.push(`| ${propName} | \`${cleanType}\` | ${required} | ${fullDescription} |`)
	})

	return lines.join('\n')
}
