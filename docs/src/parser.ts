import { Project, Node, JSDoc, SyntaxKind, JSDocTag, TypeAliasDeclaration, InterfaceDeclaration } from 'ts-morph'
import * as path from 'path'
import { ComponentSourceData, PropData } from './types'

export class ComponentParser {
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

	public async parseComponentSource(
		filePath: string,
		skipComponents?: Set<string>,
	): Promise<ComponentSourceData[]> {
		if (path.basename(filePath) === 'index.ts') {
			// eslint-disable-next-line no-console
			console.log(`Skipping ${filePath} file`)
			return []
		}

		const results: ComponentSourceData[] = []
		try {
			const project = this.ensureTsMorphProject()
			const sourceFile = project.addSourceFileAtPath(filePath)
			sourceFile.refreshFromFileSystemSync()

			const propsTypeMap = new Map<string, Record<string, PropData>>()
			const exportedDeclarations = sourceFile.getExportedDeclarations()

			for (const [name, declarations] of Array.from(exportedDeclarations.entries())) {
				if (declarations.length === 0) continue
				const declaration = declarations[0]

				if (Node.isTypeAliasDeclaration(declaration) || Node.isInterfaceDeclaration(declaration)) {
					if (name.endsWith('Props')) {
						const propData = this.extractPropsFromTypeOrInterface(declaration)
						propsTypeMap.set(name, propData)
					}
				}
			}

			for (const [name, declarations] of Array.from(exportedDeclarations.entries())) {
				if (skipComponents?.has(name)) {
					// eslint-disable-next-line no-console
					console.log(`Skipping already processed component: ${name} in ${filePath}`)
					continue
				}

				if (declarations.length === 0) continue
				const declaration = declarations[0]

				// Skip prop types
				if (name.endsWith('Props')) {
					continue
				}

				const isPotentialComponent = Node.isVariableDeclaration(declaration) ||
					Node.isFunctionDeclaration(declaration) ||
					Node.isClassDeclaration(declaration)

				if (!isPotentialComponent) {
					continue
				}

				const jsDocNode = this.getJSDocNode(declaration)
				if (!jsDocNode) {
					continue // Skip components without JSDoc
				}

				const jsdoc = jsDocNode.getFullText().trim()
				const examples = this.getJSDocExamples(jsDocNode)
				const links = this.getJSDocLinks(jsDocNode)
				const propsName = `${name}Props`
				let props: Record<string, PropData> = {}

				if (propsTypeMap.has(propsName)) {
					props = propsTypeMap.get(propsName) || {}
				} else {
					const linkedPropsType = this.findLinkedPropsType(jsDocNode)
					if (linkedPropsType && propsTypeMap.has(linkedPropsType)) {
						props = propsTypeMap.get(linkedPropsType) || {}
					}
				}

				results.push({
					componentName: name,
					filePath,
					jsdoc,
					props,
					links,
					examples,
				})
			}
		} catch (error) {
			console.error(`Error parsing component source file ${filePath}:`, error)
			// Return empty array on error
		}

		return results
	}

	private getJSDocNode(node: Node): JSDoc | undefined {
		if (Node.isJSDocable(node)) {
			const jsDocs = node.getJsDocs()
			if (jsDocs.length > 0) {
				return jsDocs[jsDocs.length - 1] // Return the last JSDoc block (closest to the node)
			}
		}

		// For VariableDeclaration, check its VariableStatement ancestor
		if (Node.isVariableDeclaration(node)) {
			const variableStatement = node.getFirstAncestorByKind(SyntaxKind.VariableStatement)
			if (variableStatement && Node.isJSDocable(variableStatement)) {
				const jsDocs = variableStatement.getJsDocs()
				if (jsDocs.length > 0) {
					return jsDocs[jsDocs.length - 1] // Return the last JSDoc block
				}
			}
		}

		return undefined
	}

	private getJSDocLinks(jsDocNode: JSDoc | undefined): string[] {
		if (!jsDocNode) return []

		const links: string[] = []

		// Extract {@link ...} references from the description
		const description = jsDocNode.getDescription() || ''
		const linkRegex = /{@link\s+([^}]+)}/g
		let match
		while ((match = linkRegex.exec(description)) !== null) {
			links.push(match[1].trim())
		}

		// Extract @link tag content
		jsDocNode.getTags()
			.filter((tag): tag is JSDocTag => tag.getTagName() === 'link')
			.forEach(tag => {
				const commentText = tag.getCommentText()?.trim()
				if (commentText) {
					links.push(commentText)
				}
			})

		return links
	}

	private findLinkedPropsType(jsDocNode: JSDoc | undefined): string | undefined {
		if (!jsDocNode) return undefined

		// Try to find "Props {@link TypeName}" pattern in description
		const description = jsDocNode.getDescription() || ''

		// First line often has "Props {@link SomeProps}." pattern
		const propsLinkRegex = /Props\s+{@link\s+([^}]+)}\s*\./
		const match = description.match(propsLinkRegex)

		if (match) return match[1]

		// Try other patterns
		const altLinkRegex = /{@link\s+([^}]+Props)}/
		const altMatch = description.match(altLinkRegex)

		return altMatch ? altMatch[1] : undefined
	}

	private getJSDocExamples(jsDocNode: JSDoc | undefined): string[] {
		if (!jsDocNode) return []

		const examples = new Set<string>()
		const codeBlockRegex = /```(?:tsx?|jsx?|ts|js)?\s*([\s\S]*?)```/g

		// Extract examples from @example tags
		jsDocNode.getTags()
			.filter((tag): tag is JSDocTag => tag.getTagName() === 'example')
			.forEach(tag => {
				const commentText = tag.getCommentText()?.trim()
				if (commentText) {
					examples.add(commentText)
				}
			})

		// Extract examples from JSDoc description
		const mainComment = jsDocNode.getDescription()?.trim()
		if (mainComment) {
			// Look for heading-style examples like "#### Example: Something"
			const exampleHeadingRegex = /(#{1,6}\s*Example:.*?)(#{1,6}|$)/g
			let headingMatch

			while ((headingMatch = exampleHeadingRegex.exec(mainComment)) !== null) {
				const exampleSection = headingMatch[1].trim()
				if (exampleSection) {
					examples.add(exampleSection)
				}
			}

			// If none found with headings, try to extract standalone code blocks
			if (examples.size === 0) {
				let codeMatch
				codeBlockRegex.lastIndex = 0
				while ((codeMatch = codeBlockRegex.exec(mainComment)) !== null) {
					if (codeMatch[0]) {
						examples.add(codeMatch[0])
					}
				}
			}
		}

		return Array.from(examples)
	}

	private extractPropsFromTypeOrInterface(declaration: TypeAliasDeclaration | InterfaceDeclaration): Record<string, PropData> {
		const props: Record<string, PropData> = {}

		if (Node.isInterfaceDeclaration(declaration)) {
			// Handle interface props
			const properties = declaration.getProperties()
			properties.forEach(property => {
				const name = property.getName()
				const type = property.getType().getText()
				const isOptional = property.hasQuestionToken()

				// Get property JSDoc
				const jsDocNode = this.getJSDocNode(property)
				const description = jsDocNode?.getDescription()?.trim()

				// Get default value from @default tag if it exists
				const defaultValue = jsDocNode?.getTags()
					.find(tag => tag.getTagName() === 'default')
					?.getCommentText()?.trim()

				props[name] = {
					name,
					type,
					description,
					required: !isOptional,
					defaultValue,
				}
			})
		} else if (Node.isTypeAliasDeclaration(declaration)) {
			// Handle type alias props
			const typeText = declaration.getTypeNode()?.getText() || ''

			// Handle object type directly defined in the type alias
			if (typeText.startsWith('{')) {
				// Extract properties from inline object type definition
				const typeMembers = declaration.getTypeNode()?.forEachChildAsArray() || []

				typeMembers.forEach(member => {
					if (Node.isPropertySignature(member)) {
						const name = member.getName()
						const type = member.getType().getText()
						const isOptional = member.hasQuestionToken()

						// Get JSDoc for this property
						const jsDocNode = this.getJSDocNode(member)
						const description = jsDocNode?.getDescription()?.trim()

						props[name] = {
							name,
							type,
							description,
							required: !isOptional,
						}
					}
				})
			}

			// Handle intersection types
			if (typeText.includes('&')) {
				const type = declaration.getType()
				if (type.isIntersection()) {
					const intersectionTypes = type.getIntersectionTypes()
					for (const intersectedType of intersectionTypes) {
						this.extractPropsFromType(intersectedType, props)
					}
				}
			}
		}

		return props
	}

	private extractPropsFromType(type: any, props: Record<string, PropData>): void {
		try {
			if (type.getProperties) {
				const properties = type.getProperties()
				for (const prop of properties) {
					const name = prop.getName()
					const propType = prop.getDeclarations()?.[0]?.getType().getText() || 'any'

					// Skip if we already have this property
					if (props[name]) continue

					// Try to determine if it's optional
					let isOptional = false
					try {
						const valueDecl = prop.getValueDeclaration()
						if (valueDecl) {
							isOptional = valueDecl.getChildrenOfKind(SyntaxKind.QuestionToken).length > 0
						}
					} catch (err) {
						// If we can't determine, assume it's required
						isOptional = false
					}

					// Try to get JSDoc for the property
					let description: string | undefined

					try {
						const valueDecl = prop.getValueDeclaration()
						if (valueDecl && Node.isJSDocable(valueDecl)) {
							const jsDoc = valueDecl.getJsDocs()[0]
							description = jsDoc?.getDescription()?.trim()
						}
					} catch (err) {
						// If we can't get the description, leave undefined
					}

					props[name] = {
						name,
						type: propType,
						description,
						required: !isOptional,
					}
				}
			}
		} catch (error) {
			console.error('Error extracting props from type:', error)
		}
	}
}
