import { Project, Node } from 'ts-morph'
import * as fs from 'fs'
import { ComponentSourceData, PropData } from './types'

interface ParsedApiComponent {
	name: string
	kind: 'const' | 'interface' | 'type' | 'class'
	docComment?: string
	props?: Record<string, PropData>
}

let tsMorphProject: Project | null = null

/**
 * Parses an API Extractor markdown file to extract component information.
 */
export function parseApiExtractorMd(mdPath: string): Map<string, ParsedApiComponent> {
	try {
		if (!fs.existsSync(mdPath)) {
			console.error(`API Extractor MD file not found at: ${mdPath}`)
			return new Map()
		}

		const content = fs.readFileSync(mdPath, 'utf-8')
		// eslint-disable-next-line no-console
		console.log('Read API MD file, length:', content.length)

		const components = new Map<string, ParsedApiComponent>()

		// Find the TypeScript section between ```ts and ```
		const tsSectionMatch = content.match(/```ts\s*([\s\S]*?)```/)
		if (!tsSectionMatch) {
			console.warn('No TypeScript section found in API MD file')
			return components
		}

		const tsSection = tsSectionMatch[1]
		// eslint-disable-next-line no-console
		console.log('Found TypeScript section:', tsSection)

		let currentComponent: ParsedApiComponent | null = null
		let currentDocComment = ''
		let isReadingProps = false

		// Process line by line
		const lines = tsSection.split('\n')
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim()

			// Skip empty lines and package documentation comment
			if (!line || line === '// (No @packageDocumentation comment for this package)') continue

			// Debug line processing
			// eslint-disable-next-line no-console
			console.log('Processing line:', line)

			// Collect doc comments
			if (line.startsWith('//')) {
				const commentText = line.substring(2).trim()
				if (commentText.startsWith('@public')) continue
				if (commentText) {
					currentDocComment += (currentDocComment ? '\\n' : '') + commentText
				}
				continue
			}

			// Parse export declarations
			if (line.startsWith('export')) {
				// Save previous component if exists
				if (currentComponent && !isReadingProps) {
					// eslint-disable-next-line no-console
					console.log(`Adding component to map: ${currentComponent.name}`)
					components.set(currentComponent.name, currentComponent)
				}

				currentComponent = null
				isReadingProps = false
				const declaration = line.trim()

				// Handle different export types
				if (declaration.includes('interface')) {
					const match = declaration.match(/interface\s+(\w+Props)\s*\{/)
					if (match) {
						const name = match[1]
						currentComponent = {
							name,
							kind: 'interface',
							docComment: currentDocComment,
							props: {},
						}
						isReadingProps = true
						// eslint-disable-next-line no-console
						console.log(`Found props interface: ${name}`)
					}
				} else if (declaration.includes('const')) {
					const match = declaration.match(/const\s+(\w+):/)
					if (match) {
						const name = match[1]
						currentComponent = {
							name,
							kind: 'const',
							docComment: currentDocComment,
						}
						// eslint-disable-next-line no-console
						console.log(`Found component: ${name}`)
					}
				}

				currentDocComment = ''
			} else if (isReadingProps && currentComponent?.kind === 'interface' && line.includes(':')) {
				const [propName, ...typeParts] = line.split(':')
				const cleanPropName = propName.trim().replace('?', '')
				const type = typeParts.join(':').trim().replace(';', '')
				const required = !propName.includes('?')

				if (currentComponent.props) {
					currentComponent.props[cleanPropName] = {
						name: cleanPropName,
						type,
						required,
						description: currentDocComment,
					}
					// eslint-disable-next-line no-console
					console.log(`Added prop ${cleanPropName} to ${currentComponent.name}`)
				}
				currentDocComment = ''
			} else if (line === '}' && isReadingProps) {
				// End of props interface
				if (currentComponent) {
					// eslint-disable-next-line no-console
					console.log(`Adding props interface to map: ${currentComponent.name}`)
					components.set(currentComponent.name, currentComponent)
				}
				isReadingProps = false
				currentComponent = null
			}
		}

		// Add the last component if exists and it's not a props interface
		if (currentComponent && !isReadingProps) {
			// eslint-disable-next-line no-console
			console.log(`Adding final component to map: ${currentComponent.name}`)
			components.set(currentComponent.name, currentComponent)
		}

		// Debug output
		// eslint-disable-next-line no-console
		console.log('Found components:', Array.from(components.keys()))

		return components

	} catch (error) {
		console.error(`Error parsing API Extractor MD file ${mdPath}:`, error)
		return new Map()
	}
}

/**
 * Finds all exported components in a source file and parses their documentation.
 */
export async function parseComponentSource(
	filePath: string,
	apiMdPath: string,
): Promise<ComponentSourceData[]> {
	try {
		// Initialize ts-morph project once
		if (!tsMorphProject) {
			tsMorphProject = new Project({
				skipAddingFilesFromTsConfig: true,
				compilerOptions: {
					allowJs: true,
					declaration: true,
				},
			})
		}

		// Add or update the source file in the project
		const sourceFile = tsMorphProject.addSourceFileAtPath(filePath)
		sourceFile.refreshFromFileSystemSync() // Ensure we have the latest content

		// Parse the API MD file
		const apiComponents = parseApiExtractorMd(apiMdPath)

		// Get all exports from the source file
		const exportedDeclarations = sourceFile.getExportedDeclarations()
		const results: ComponentSourceData[] = []

		// Debug exports
		// eslint-disable-next-line no-console
		console.log('Exported declarations:', Array.from(exportedDeclarations.keys()))

		for (const [name, declarations] of exportedDeclarations) {
			const declaration = declarations[0]

			// Skip if it's not a component (interface, type, etc.)
			if (!Node.isVariableDeclaration(declaration) &&
				!Node.isFunctionDeclaration(declaration) &&
				!Node.isClassDeclaration(declaration)) {
				continue
			}

			// Get component information from the API MD
			const apiComponent = apiComponents.get(name)

			if (!apiComponent) {
				console.warn(`Component ${name} not found in API MD file.`)
				continue
			}

			// Skip if it's not a component in the API
			if (apiComponent.kind !== 'const' && apiComponent.kind !== 'class') {
				continue
			}

			// eslint-disable-next-line no-console
			console.log(`Processing component ${name} from source file`)

			let jsdoc: string | undefined
			let examples: string[] = []

			if (Node.isJSDocable(declaration)) {
				jsdoc = getJSDocComment(declaration)
				const jsDocNode = declaration.getJsDocs()[0]
				examples = getJSDocExamples(jsDocNode)
			}

			// Find corresponding props interface
			const propsInterfaceName = `${name}Props`
			const propsComponent = apiComponents.get(propsInterfaceName)
			const props = propsComponent?.props || apiComponent?.props

			results.push({
				componentName: name,
				filePath,
				jsdoc: jsdoc || apiComponent?.docComment,
				props,
				examples,
			})

			// eslint-disable-next-line no-console
			console.log(`Added component ${name} to results`)
		}

		return results

	} catch (error) {
		console.error(`Error parsing component file ${filePath}:`, error)
		return []
	}
}

/**
 * Extracts the primary JSDoc comment block from a node.
 */
function getJSDocComment(node: Node): string | undefined {
	if (Node.isJSDocable(node)) {
		const jsDocs = node.getJsDocs()
		if (jsDocs.length > 0) {
			// Return the full text of the first JSDoc block
			return jsDocs[0].getFullText()
		}
	}
	// Handle VariableStatement if the JSDoc is attached there
	const parent = node.getParent()
	if (Node.isVariableDeclaration(node) && parent && Node.isVariableDeclarationList(parent)) {
		const statement = parent.getParent()
		if (statement && Node.isVariableStatement(statement)) {
			const jsDocs = statement.getJsDocs()
			if (jsDocs.length > 0) {
				return jsDocs[0].getFullText()
			}
		}
	}
	return undefined
}

/**
 * Extracts @example tags from a JSDoc comment.
 */
function getJSDocExamples(jsDocNode: import('ts-morph').JSDoc | undefined): string[] {
	if (!jsDocNode) return []
	return jsDocNode.getTags()
		.filter(tag => tag.getTagName() === 'example')
		.map(tag => tag.getCommentText()?.trim()) // Get text after @example
		.filter((text): text is string => !!text) // Filter out undefined/empty
}
