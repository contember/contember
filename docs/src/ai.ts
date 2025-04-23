import OpenAI from 'openai'
import type { AIPromptData, ComponentOverride, DocsConfig } from './types'

const openai = new OpenAI()

export const buildPrompt = (
	data: AIPromptData,
	override?: ComponentOverride,
): string => {
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

	if (data.examples?.length) {
		const originalCount = data.originalExamplesCount || 0

		if (originalCount > 0) {
			data.examples.forEach((example, index) => {
				if (index < originalCount) {
					sourceExamples.push(example)
				} else {
					playgroundExamples.push(example)
				}
			})
		} else {
			sourceExamples.push(...data.examples)
		}
	}

	lines.push(`## Examples (from source code)`)
	if (sourceExamples.length > 0) {
		sourceExamples.forEach(example => {
			// Ensure each stored example is trimmed
			lines.push('```tsx')
			lines.push(example.trim())
			lines.push('```')
		})
	} else {
		lines.push('_No examples provided in source code._')
	}
	lines.push('')

	if (playgroundExamples.length > 0) {
		lines.push(`## Real-World Examples (from playground)`)
		playgroundExamples.forEach((example, index) => {
			lines.push(`### Example ${index + 1}`)
			lines.push('```tsx')
			lines.push(example.trim())
			lines.push('```')
		})
		lines.push('_These examples show how the component is used in real Contember applications. Use them for reference on component integration patterns._')
		lines.push('')
	}

	if (override?.notes) {
		lines.push(`## Additional Notes/Context\n${override.notes}\n`)
	}

	if (data.previousDocContent) {
		const regenerationReason = data.regenerationReason || {
			isUpdate: true,
			originalExamplesCount: 0,
			newExamplesCount: data.examples?.length || 0,
			playgroundExamplesAdded: 0,
			hasNewImports: false,
		}
		const playgroundExamplesAdded = regenerationReason.playgroundExamplesAdded || 0
		const hasNewImports = regenerationReason.hasNewImports || false

		// Create a specific reason message based on what changed
		let changeReason = 'Documentation is being regenerated because:'
		if (playgroundExamplesAdded > 0) {
			changeReason += `\n- ${playgroundExamplesAdded} new playground example(s) have been added.`
		}
		if (hasNewImports) {
			changeReason += '\n- New import examples are now available.'
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
		const originalExamplesCount = sourceData.originalExamplesCount || 0
		const totalExamplesCount = sourceData.examples?.length || 0
		const playgroundExamplesCount = totalExamplesCount - originalExamplesCount

		sourceData.regenerationReason = {
			isUpdate: true,
			originalExamplesCount,
			newExamplesCount: totalExamplesCount,
			playgroundExamplesAdded: playgroundExamplesCount,
			hasNewImports: !!sourceData.imports && sourceData.imports.length > 0,
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
		// Create system prompt with specific instructions for updating docs
		let systemPrompt = 'You are an expert technical writer generating Markdown documentation for React components for a Docusaurus site.'

		// Add specific instructions if we're updating existing documentation
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
		const examplesCountTag = `<!-- Examples count: ${examplesCount} -->`
		const editedByHumanRegex = /<!--\s*Edited by human:\s*(true|false)\s*-->\n*/
		const examplesCountRegex = /<!--\s*Examples count:\s*\d+\s*-->\n*/

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

		finalContent =
			contentBeforeInsert.trimEnd() + '\n\n' +
			editedByHumanTag + '\n' +
			examplesCountTag + '\n\n' +
			contentAfterInsert.trimStart()

		return finalContent

	} catch (error) {
		console.error(`Error calling OpenAI API for ${sourceData.componentName}:`, error)
		return null // Indicate failure
	}
}
