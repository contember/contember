import OpenAI from 'openai'
import type { AIPromptData, ComponentOverride, DocsConfig } from './types'

const openai = new OpenAI()

export const buildPrompt = (data: AIPromptData, override?: ComponentOverride): string => {
	const lines: string[] = []

	lines.push(`You are an **expert technical writer** creating Docusaurus pages for Contember React components.

**Follow _every_ numbered instruction exactly** and respond **only** with valid Markdown.

### 1. Document Structure
1. **Overview** – 1-2 concise paragraphs (from JSDoc)
2. **Styling Guidelines** – State that all examples use Tailwind; mention any required Contember theme classes.
3. **Core Concepts** – Bullet list of ideas the reader must grasp.
4. **Quick Start** – Smallest functional example (Tailwind classes included).
5. **Detailed Guide** *(optional)* – Walkthrough with multiple snippets.
6. **Props Reference** – Markdown table with columns **Name | Type | Required | Default | Description**.
    - *Required* must be the literal text **“Yes”** or **“No”**—no emojis, ticks, or booleans.
    - List inherited props last.
7. **Sub-Components / Building Blocks** – Filters, Triggers, Hooks, etc. Give each its own \`### <Name>\` heading.
8. **Examples** – Focused, real-world scenarios with explanations under each code block.
9. **Best Practices & Gotchas** – Bullet list.
10. **Further Reading** – Related components / concepts.

### 2. Writing Style
* Use active voice and second person ("you").
* Keep sentences < 24 words.
* Prefer bullet lists over long paragraphs.
* Code fences: \` \`\`\`tsx \`\`\` for TS/JSX, \` \`\`\`bash \`\`\` for CLI.
* Insert Tailwind classes directly in JSX (e.g. \`className="flex gap-2"\`).

### 3. Output Rules
* **Do not** invent props or examples that are not present in the source data.
* If a section has no content, write "_None_".
* End the document with \`<!-- End of Generated Documentation -->\`.

--- Source Data ---\n`)

	lines.push(`## Component\n${data.componentName}\n`)

	lines.push(
		`## Description (from JSDoc)\n${
			data.jsdoc ?? '_No JSDoc description provided._'
		}\n`,
	)

	lines.push(`## API Props (from Type Analysis)`)
	if (data.props && Object.keys(data.props).length) {
		lines.push('```json')
		lines.push(JSON.stringify(data.props, null, 2))
		lines.push('```')
	} else {
		lines.push('_No props data provided or extracted._')
	}
	lines.push('')

	// Add import examples if available
	if ((data as any).imports && (data as any).imports.length) {
		lines.push(`## Import Examples (from playground)`)
		const imports = (data as any).imports as string[]
		imports.forEach(importStatement => {
			lines.push('```tsx')
			lines.push(importStatement.trim())
			lines.push('```')
		})
		lines.push('')
	}

	const sourceExamples: string[] = []
	const playgroundExamples: string[] = []
	const externalExamples: { example: string; projectName?: string }[] = []

	if (data.exampleSources && data.exampleSources.length) {
		data.exampleSources.forEach((sourceInfo, index) => {
			const example = data.examples?.[index]

			if (!example) return

			if (!sourceInfo) {
				// If no source info, default to JSDoc example
				sourceExamples.push(example)
			} else if (sourceInfo.source === 'jsdoc') {
				sourceExamples.push(example)
			} else if (sourceInfo.source === 'playground') {
				playgroundExamples.push(example)
			} else if (sourceInfo.source === 'external') {
				externalExamples.push({
					example,
					projectName: sourceInfo.projectName,
				})
			}
		})
	} else if (data.examples?.length) {
		const originalCount = data.originalExamplesCount || 0
		const playgroundCount = data.playgroundExamplesCount || 0

		data.examples.forEach((example, index) => {
			if (index < originalCount) {
				sourceExamples.push(example)
			} else if (index < originalCount + playgroundCount) {
				playgroundExamples.push(example)
			} else {
				externalExamples.push({ example })
			}
		})
	}

	lines.push(`## Examples (from source code)`)
	if (sourceExamples.length > 0) {
		sourceExamples.forEach(example => {
			lines.push('```tsx')
			lines.push(example.trim())
			lines.push('```')
		})
	} else {
		lines.push('_No examples provided in source code._')
	}
	lines.push('')

	if (playgroundExamples.length > 0) {
		lines.push(`## Real-World Examples (from Contember playground)`)
		playgroundExamples.forEach((example, index) => {
			lines.push(`### Playground Example ${index + 1}`)
			lines.push('```tsx')
			lines.push(example.trim())
			lines.push('```')
		})
		lines.push('_These examples show how the component is used in the Contember playground. Use them for reference on component integration patterns._')
		lines.push('')
	}

	// Add external project examples section to prompt
	if (externalExamples.length > 0) {
		lines.push(`## Real-World Examples (from external Contember projects)`)

		// Group examples by project name
		const projectGroups = new Map<string, string[]>()

		externalExamples.forEach(({ example, projectName }) => {
			const key = projectName || 'Unnamed Project'
			if (!projectGroups.has(key)) {
				projectGroups.set(key, [])
			}
			projectGroups.get(key)?.push(example)
		})

		// Add each project's examples
		Array.from(projectGroups.entries()).forEach(([projectName, examples], projectIndex) => {
			lines.push(`### ${projectName}`)

			examples.forEach((example, index) => {
				lines.push(`#### Example ${index + 1}`)
				lines.push('```tsx')
				lines.push(example.trim())
				lines.push('```')
			})
		})

		lines.push('_These examples from real-world Contember projects show how the component is used in production applications. They provide valuable context for integration patterns and best practices._')
		lines.push('')
	}

	if (override?.notes) {
		lines.push(`## Additional Notes/Context\n${override.notes}\n`)
	}

	if (data.previousDocContent) {
		let changeReason = 'Documentation is being regenerated because:'

		const reason = data.regenerationReason

		if (reason) {
			if (reason.sourceExamplesChanged) {
				if (reason.sourceExamplesCount > reason.previousSourceCount) {
					changeReason += `\n- Source examples increased from ${reason.previousSourceCount} to ${reason.sourceExamplesCount}.`
				} else if (reason.sourceExamplesCount < reason.previousSourceCount) {
					changeReason += `\n- Source examples decreased from ${reason.previousSourceCount} to ${reason.sourceExamplesCount}.`
				}
			}

			if (reason.playgroundExamplesChanged) {
				if (reason.playgroundExamplesCount > reason.previousPlaygroundCount) {
					changeReason += `\n- ${reason.playgroundExamplesCount - reason.previousPlaygroundCount} new playground example(s) have been added.`
				} else if (reason.playgroundExamplesCount < reason.previousPlaygroundCount) {
					changeReason += `\n- ${reason.previousPlaygroundCount - reason.playgroundExamplesCount} playground example(s) have been removed.`
				}
			}

			if (reason.externalExamplesChanged) {
				if (reason.externalExamplesCount > reason.previousExternalCount) {
					changeReason += `\n- ${reason.externalExamplesCount - reason.previousExternalCount} new external project example(s) have been added.`
				} else if (reason.externalExamplesCount < reason.previousExternalCount) {
					changeReason += `\n- ${reason.previousExternalCount - reason.externalExamplesCount} external project example(s) have been removed.`
				}
			}

			if (reason.importsChanged) {
				if (reason.importsCount > reason.previousImportsCount) {
					changeReason += `\n- ${reason.importsCount - reason.previousImportsCount} new import example(s) are now available.`
				} else if (reason.importsCount < reason.previousImportsCount) {
					changeReason += `\n- ${reason.previousImportsCount - reason.importsCount} import example(s) have been removed.`
				}
			}
		} else {
			// Fallback if no detailed reason
			if (reason.playgroundExamplesCount > 0) {
				changeReason += `\n- ${reason.playgroundExamplesCount} playground example(s) have been added.`
			}
			if (reason.externalExamplesCount > 0) {
				changeReason += `\n- ${reason.externalExamplesCount} external project example(s) have been added.`
			}
			if (reason.importsCount > 0) {
				changeReason += '\n- Import examples are now available.'
			}
		}

		lines.push(`## Previous Documentation Version
The following is the previous version of the documentation for this component.
Use it as a reference to maintain consistency in style and any custom explanations.
Only update parts that need to change due to new examples or information.

${changeReason}

Important instructions:
1. Preserve the structure, custom explanations, and insights from the previous version.
2. Keep any manually written sections that aren't directly tied to examples.
3. Update the examples section with the new examples provided above.
4. Update any descriptions that reference the examples or API if they've changed.
5. The number of examples has changed, so make sure to incorporate all the new examples properly.

\`\`\`markdown
${(data as any).previousDocContent}
\`\`\`
`)
	}

	lines.push(`--- Generated Documentation ---`)

	return lines.join('\n')
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

	const model = aiConfig?.model || 'gpt-3.5-turbo'

	// --- Optional: Log the prompt for debugging ---
	// console.log(`\n--- AI Prompt for ${sourceData.componentName} ---`)
	// console.log(prompt)
	// console.log(`--- End AI Prompt ---`)
	// ---

	try {
		let systemPrompt = 'You are an expert technical writer generating Markdown documentation for React components for a Docusaurus site.'

		if ((sourceData as any).previousDocContent) {
			systemPrompt += `

When updating existing documentation:
1. Maintain the same overall structure and headings.
2. Preserve any custom explanations or insights from the previous version.
3. Integrate new examples in the appropriate sections.
4. Update any outdated information based on new examples.
5. Keep the same writing style and tone.
6. Ensure the documentation remains coherent as a whole.`
		}

		const completion = await openai.chat.completions.create({
			model: model,
			messages: [
				{
					role: 'system',
					content: systemPrompt,
				},
				{ role: 'user', content: prompt },
			],
			// Optional parameters (adjust as needed):
			// temperature: 0.7, // Controls randomness (0.0 to 2.0)
			// max_tokens: 1500, // Max length of the generated response
			// top_p: 1.0,
			// frequency_penalty: 0.0,
			// presence_penalty: 0.0,
		})

		const content = completion.choices[0]?.message?.content

		if (!content) {
			console.error(`AI response for ${sourceData.componentName} was empty.`)
			return null
		}

		// --- Basic Post-processing (Optional) ---
		// You might want to add logic here to clean up the AI's output,
		// ensure the frontmatter is correct, etc.
		let finalContent = content.trim()

		const title = override?.title || sourceData.componentName
		const sidebarLabel = sourceData.componentName
		const examplesCount = sourceData.examples?.length || 0
		const frontmatter = `---
title: ${title}
---

`

		if (finalContent.startsWith('---')) {
			const frontmatterEnd = finalContent.indexOf('---', 3)
			if (frontmatterEnd > 0) {
				finalContent = frontmatter + finalContent.substring(frontmatterEnd + 3).trim()
			} else {
				finalContent = frontmatter + finalContent
			}
		} else {
			finalContent = frontmatter + finalContent
		}

		const editedByHumanTag = `<!-- Edited by human: false -->`
		const sourceExamplesCount = sourceData.originalExamplesCount || 0
		const playgroundExamplesCount = sourceData.playgroundExamplesCount || 0
		const externalExamplesCount = sourceData.externalProjectExamplesCount || 0
		const importsCount = sourceData.imports?.length || 0

		const examplesCountTag = `<!-- Examples count: ${examplesCount} -->`
		const sourceExamplesTag = `<!-- Source examples: ${sourceExamplesCount} -->`
		const playgroundExamplesTag = `<!-- Playground examples: ${playgroundExamplesCount} -->`
		const externalExamplesTag = `<!-- External examples: ${externalExamplesCount} -->`
		const importsTag = `<!-- Import examples: ${importsCount} -->`

		const editedByHumanRegex = /<!--\s*Edited by human:\s*(true|false)\s*-->\n*/
		const examplesCountRegex = /<!--\s*Examples count:\s*\d+\s*-->\n*/
		const sourceExamplesRegex = /<!--\s*Source examples:\s*\d+\s*-->\n*/
		const playgroundExamplesRegex = /<!--\s*Playground examples:\s*\d+\s*-->\n*/
		const externalExamplesRegex = /<!--\s*External examples:\s*\d+\s*-->\n*/
		const importsRegex = /<!--\s*Import examples:\s*\d+\s*-->\n*/

		const frontmatterEndIndex = finalContent.indexOf('---', 3)
		let insertPosition = 0
		if (frontmatterEndIndex > 0) {
			const newlineAfterFrontmatter = finalContent.indexOf('\n', frontmatterEndIndex + 3)
			if (newlineAfterFrontmatter > 0) {
				insertPosition = newlineAfterFrontmatter + 1 // Insert after the newline
			} else {
				insertPosition = finalContent.length
				finalContent += '\n' // Add a newline if missing
			}
		} else {
			insertPosition = 0
		}

		let contentBeforeInsert = finalContent.substring(0, insertPosition)
		let contentAfterInsert = finalContent.substring(insertPosition)

		contentAfterInsert = contentAfterInsert.replace(editedByHumanRegex, '')
		contentAfterInsert = contentAfterInsert.replace(examplesCountRegex, '')
		contentAfterInsert = contentAfterInsert.replace(sourceExamplesRegex, '')
		contentAfterInsert = contentAfterInsert.replace(playgroundExamplesRegex, '')
		contentAfterInsert = contentAfterInsert.replace(externalExamplesRegex, '')
		contentAfterInsert = contentAfterInsert.replace(importsRegex, '')

		const escapePipesInCell = (text: string): string => {
			let result = ''
			let inCode = false
			for (let i = 0; i < text.length; i++) {
				const char = text[i]
				if (char === '`' && (i === 0 || text[i - 1] !== '\\')) {
					inCode = !inCode
				}
				if (char === '|' && !inCode) {
					result += '\\|'
				} else {
					result += char
				}
			}
			return result
		}

		const propsTableRegex = /(### Props Reference\s*\n\s*\|.*?\|\s*\n\|.*?---\|.*?\n)([\s\S]*?)(\n\n\s*[^|]|\n\s*###|$)/
		const tableMatch = contentAfterInsert.match(propsTableRegex)

		if (tableMatch) {
			const tableHeaderAndSeparator = tableMatch[1]
			const tableBodyOriginal = tableMatch[2].trimEnd()
			const afterTableMarker = tableMatch[3]
			const tableRows = tableBodyOriginal.split('\n').filter(line => {
				const trimmedLine = line.trim()
				return trimmedLine.startsWith('|') && trimmedLine.endsWith('|') && trimmedLine.length > 2
			})

			const processedRows = tableRows.map(row => {
				const cells = row.split('|').slice(1, -1)
				const processedCells = cells.map(cellContent => {
					const trimmedContent = cellContent.trim()
					const escapedContent = escapePipesInCell(trimmedContent)

					return escapedContent ? `\`${escapedContent}\`` : ''
				})

				return `| ${processedCells.join(' | ')} |`
			})

			const processedTableBody = processedRows.join('\n')
			const processedTableSection = tableHeaderAndSeparator + processedTableBody

			contentAfterInsert = contentAfterInsert.replace(
				tableHeaderAndSeparator + tableBodyOriginal,
				processedTableSection
			)
		}

		finalContent =
			contentBeforeInsert.trimEnd() + '\n\n' +
			editedByHumanTag + '\n' +
			examplesCountTag + '\n' +
			sourceExamplesTag + '\n' +
			playgroundExamplesTag + '\n' +
			externalExamplesTag + '\n' +
			importsTag + '\n\n' +
			contentAfterInsert.trimStart()

		return finalContent

	} catch (error) {
		console.error(`Error calling OpenAI API for ${sourceData.componentName}:`, error)
		return null // Indicate failure
	}
}
