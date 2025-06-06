import { Project, Node } from 'ts-morph'
import * as path from 'path'
import * as fs from 'fs'

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

	public async findComponentExamples(
		componentName: string,
		directoryPath: string,
		excludeFolders?: string[],
	): Promise<string[]> {
		const project = this.ensureTsMorphProject()
		const examples: string[] = []

		try {
			if (!fs.existsSync(directoryPath)) {
				console.warn(`Directory not found: ${directoryPath}`)
				return examples
			}

			const files = this.getSourceFilesRecursively(directoryPath, ['.tsx', '.jsx'], excludeFolders)

			// eslint-disable-next-line no-console
			console.log(`Searching for ${componentName} usage in ${files.length} files...`)

			for (const file of files) {
				try {
					const existingSource = project.getSourceFile(file)
					if (!existingSource) {
						project.addSourceFileAtPath(file)
					}
				} catch (error) {
					console.warn(`Error adding file ${file} to project:`, error)
				}
			}

			for (const sourceFile of project.getSourceFiles()) {
				const examplesInFile = this.findComponentUsageInSourceFile(sourceFile, componentName)
				examples.push(...examplesInFile)
			}

			return examples.slice(0, 5)
		} catch (error) {
			console.error(`Error finding examples for component ${componentName}:`, error)
			return examples
		}
	}

	private getSourceFilesRecursively(dir: string, extensions: string[], excludeFolders?: string[]): string[] {
		const results: string[] = []

		const items = fs.readdirSync(dir, { withFileTypes: true })

		for (const item of items) {
			const fullPath = path.join(dir, item.name)

			if (item.isDirectory()) {
				const isExcluded =
					item.name === 'node_modules' ||
					item.name.startsWith('.') ||
					this.isFolderExcluded(item.name, fullPath, excludeFolders)

				if (!isExcluded) {
					results.push(...this.getSourceFilesRecursively(fullPath, extensions, excludeFolders))
				}
			} else if (extensions.some(ext => item.name.endsWith(ext))) {
				results.push(fullPath)
			}
		}

		return results
	}

	private isFolderExcluded(folderName: string, fullPath: string, excludeFolders?: string[]): boolean {
		if (!excludeFolders || excludeFolders.length === 0) {
			return false
		}

		for (const pattern of excludeFolders) {
			if (pattern === folderName) {
				return true
			}

			if (pattern.includes('*')) {
				try {
					const regexPattern = pattern
						.replace(/\./g, '\\.')
						.replace(/\*/g, '.*')

					const regex = new RegExp(`^${regexPattern}$`)
					if (regex.test(folderName)) {
						return true
					}

					const relativePath = path.relative(process.cwd(), fullPath)
					const pathParts = relativePath.split(path.sep)

					for (const part of pathParts) {
						if (regex.test(part)) {
							return true
						}
					}
				} catch (error) {
					console.warn(`Error processing exclude pattern ${pattern}:`, error)
				}
			}
		}

		return false
	}

	private findComponentUsageInSourceFile(sourceFile: any, componentName: string): string[] {
		const examples: string[] = []

		try {
			sourceFile.forEachDescendant(node => {
				if (Node.isJsxOpeningElement(node) || Node.isJsxSelfClosingElement(node)) {
					const tagName = node.getTagNameNode().getText()

					if (tagName === componentName) {
						const jsxElement = node.getParent()

						if (jsxElement) {
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

	private extractComponentUsageExample(jsxElement: any, examples: string[]): void {
		try {
			let elementText = jsxElement.getText()

			let parent = jsxElement.getParent()
			while (parent) {
				if (Node.isReturnStatement(parent)) {
					const functionNode = this.findAncestorFunction(parent)
					if (functionNode) {
						elementText = functionNode.getText()
						break
					}
				}

				if (Node.isFunctionDeclaration(parent) ||
					Node.isVariableStatement(parent) ||
					Node.isArrowFunction(parent)) {
					elementText = parent.getText()
					break
				}

				parent = parent.getParent()

				if (Node.isSourceFile(parent)) break
			}

			if (elementText.length < 2000) {
				examples.push(elementText)
			} else {
				examples.push(jsxElement.getText())
			}
		} catch (error) {
			console.warn('Error extracting component usage example:', error)
		}
	}

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

	public async findComponentImports(
		componentName: string,
		directoryPath: string,
		excludeFolders?: string[],
	): Promise<string[]> {
		const project = this.ensureTsMorphProject()
		const imports: string[] = []

		try {
			const files = this.getSourceFilesRecursively(directoryPath, ['.tsx', '.jsx'], excludeFolders)

			for (const file of files) {
				try {
					const existingSource = project.getSourceFile(file)
					if (!existingSource) {
						project.addSourceFileAtPath(file)
					}
				} catch (error) {}
			}

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

			return imports.slice(0, 3)
		} catch (error) {
			console.error(`Error finding imports for component ${componentName}:`, error)
			return imports
		}
	}
}
