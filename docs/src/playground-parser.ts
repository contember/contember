import { Project, Node, SyntaxKind } from 'ts-morph'
import * as path from 'path'
import * as fs from 'fs'

/**
 * Finds and extracts usage examples of components from the playground directory
 */
export class PlaygroundExampleFinder {
	private tsMorphProject: Project | null = null

	private ensureTsMorphProject(): Project {
		if (!this.tsMorphProject) {
			this.tsMorphProject = new Project({
				skipAddingFilesFromTsConfig: true,
				compilerOptions: {
					allowJs: true,
					declaration: true,
					jsx: 4, // React JSX
				},
			})
		}
		return this.tsMorphProject
	}

	/**
	 * Find examples of the component usage in the playground directory
	 * @param componentName The name of the component to find examples for
	 * @param playgroundDir The root directory of the playground
	 * @returns Array of example code snippets found
	 */
	public async findComponentExamples(componentName: string, playgroundDir: string): Promise<string[]> {
		const project = this.ensureTsMorphProject()
		const examples: string[] = []

		try {
			// Make sure playgroundDir exists
			if (!fs.existsSync(playgroundDir)) {
				console.warn(`Playground directory not found: ${playgroundDir}`)
				return examples
			}

			// Add all .tsx files from the playground directory
			const files = this.getSourceFilesRecursively(playgroundDir, ['.tsx', '.jsx'])

			// eslint-disable-next-line no-console
			console.log(`Searching for ${componentName} usage in ${files.length} playground files...`)

			// Add files to the project
			for (const file of files) {
				try {
					// Skip files already in the project to avoid duplicates
					const existingSource = project.getSourceFile(file)
					if (!existingSource) {
						project.addSourceFileAtPath(file)
					}
				} catch (error) {
					console.warn(`Error adding file ${file} to project:`, error)
					// Continue with next file
				}
			}

			// Now search for component usage in each file
			for (const sourceFile of project.getSourceFiles()) {
				const examplesInFile = this.findComponentUsageInSourceFile(sourceFile, componentName)
				examples.push(...examplesInFile)
			}

			// Limit to a reasonable number of examples
			return examples.slice(0, 5) // Return at most 5 examples to avoid overwhelming the AI
		} catch (error) {
			console.error(`Error finding examples for component ${componentName}:`, error)
			return examples
		}
	}

	/**
	 * Find all suitable source files in the directory recursively
	 */
	private getSourceFilesRecursively(dir: string, extensions: string[]): string[] {
		const results: string[] = []

		const items = fs.readdirSync(dir, { withFileTypes: true })

		for (const item of items) {
			const fullPath = path.join(dir, item.name)

			if (item.isDirectory()) {
				// Skip node_modules and hidden directories
				if (item.name !== 'node_modules' && !item.name.startsWith('.')) {
					results.push(...this.getSourceFilesRecursively(fullPath, extensions))
				}
			} else if (extensions.some(ext => item.name.endsWith(ext))) {
				results.push(fullPath)
			}
		}

		return results
	}

	/**
	 * Find component usage in a specific source file
	 */
	private findComponentUsageInSourceFile(sourceFile: any, componentName: string): string[] {
		const examples: string[] = []

		try {
			// Find JSX elements with the component name
			sourceFile.forEachDescendant(node => {
				if (Node.isJsxOpeningElement(node) || Node.isJsxSelfClosingElement(node)) {
					const tagName = node.getTagNameNode().getText()

					if (tagName === componentName) {
						// Found a usage of the component!
						const jsxElement = node.getParent()

						if (jsxElement) {
							// Extract the component and enough context to understand how it's used
							this.extractComponentUsageExample(jsxElement, examples)
						}
					}
				}
			})
		} catch (error) {
			console.warn(`Error analyzing file ${sourceFile.getFilePath()}:`, error)
		}

		return examples
	}

	/**
	 * Extract a meaningful code example for the component usage
	 */
	private extractComponentUsageExample(jsxElement: any, examples: string[]): void {
		try {
			// Start with the immediate JSX element
			let elementText = jsxElement.getText()

			// Check if this is part of a return statement in a function component
			let parent = jsxElement.getParent()
			while (parent) {
				// If this is a return statement, get the entire function for better context
				if (Node.isReturnStatement(parent)) {
					// Try to find the function declaration/expression
					const functionNode = this.findAncestorFunction(parent)
					if (functionNode) {
						// Get the function definition with more context
						elementText = functionNode.getText()
						break
					}
				}

				// If this is already a complete function or variable declaration, use it
				if (Node.isFunctionDeclaration(parent) ||
					Node.isVariableStatement(parent) ||
					Node.isArrowFunction(parent)) {
					elementText = parent.getText()
					break
				}

				parent = parent.getParent()

				// Prevent going too far up the tree
				if (Node.isSourceFile(parent)) break
			}

			// Add to examples if it's not too large
			if (elementText.length < 2000) { // Limit size to avoid overwhelming examples
				// Format the example as a code block
				examples.push(elementText)
			} else {
				// If the example is too large, take just the component and immediate context
				examples.push(jsxElement.getText())
			}
		} catch (error) {
			console.warn('Error extracting component usage example:', error)
		}
	}

	/**
	 * Find the containing function for a node
	 */
	private findAncestorFunction(node: any): any {
		let current = node

		while (current && !Node.isSourceFile(current)) {
			if (Node.isFunctionDeclaration(current) ||
				Node.isMethodDeclaration(current) ||
				Node.isArrowFunction(current) ||
				Node.isFunctionExpression(current)) {
				return current
			}
			current = current.getParent()
		}

		return null
	}

	/**
	 * Find imports of the component to understand how it's imported
	 * @param componentName The name of the component
	 * @param playgroundDir The playground directory
	 * @returns Array of import statements
	 */
	public async findComponentImports(componentName: string, playgroundDir: string): Promise<string[]> {
		const project = this.ensureTsMorphProject()
		const imports: string[] = []

		try {
			const files = this.getSourceFilesRecursively(playgroundDir, ['.tsx', '.jsx'])

			// Add files to the project if needed
			for (const file of files) {
				try {
					// Skip files already in the project
					const existingSource = project.getSourceFile(file)
					if (!existingSource) {
						project.addSourceFileAtPath(file)
					}
				} catch (error) {
					// Skip problematic files
				}
			}

			// Search for imports of the component
			for (const sourceFile of project.getSourceFiles()) {
				sourceFile.getImportDeclarations().forEach(importDecl => {
					const namedImports = importDecl.getNamedImports()

					for (const namedImport of namedImports) {
						if (namedImport.getName() === componentName) {
							imports.push(importDecl.getText())
							break
						}
					}
				})
			}

			return imports.slice(0, 3) // Limit to 3 most relevant imports
		} catch (error) {
			console.error(`Error finding imports for component ${componentName}:`, error)
			return imports
		}
	}
}
