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

	public async parseComponentSource(filePath: string, skipComponents?: Set<string>): Promise<ComponentSourceData[]> {
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

				if (name.endsWith('Props') && (Node.isTypeAliasDeclaration(declaration) || Node.isInterfaceDeclaration(declaration))) {
					// eslint-disable-next-line no-console
					console.log(`Skipping prop type: ${name} in ${filePath}`)
					continue
				}

				// Check if the declaration looks like a component (Function, Class, Variable potentially holding a component)
				const isPotentialComponent = Node.isVariableDeclaration(declaration) ||
					Node.isFunctionDeclaration(declaration) ||
					Node.isClassDeclaration(declaration)

				if (!isPotentialComponent) {
					continue // Skip exports that aren't potential components
				}

				const jsDocNode = this.getJSDocNode(declaration)
				const jsdoc = jsDocNode?.getFullText().trim() ?? ''
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

				// Extract group information and metadata
				const groupName = this.getGroupName(jsDocNode)
				const isInternal = this.isInternalComponent(jsDocNode)

				// Parse sub-components and hooks
				const { subComponents, hooks } = this.parseSubComponentsAndHooks(jsdoc)

				// A component is a main component if it has sub-components or hooks defined
				const isMainComponent = subComponents.length > 0 || hooks.length > 0

				results.push({
					componentName: name,
					filePath,
					jsdoc,
					props,
					links,
					examples,
					groupName,
					isMainComponent,
					isInternal,
					subComponents: subComponents.length > 0 ? subComponents : undefined,
					hooks: hooks.length > 0 ? hooks : undefined,
				})
			}
		} catch (error) {
			console.error(`Error parsing component source file ${filePath}:`, error)
		}

		return results
	}

	private getJSDocNode(node: Node): JSDoc | undefined {
		if (Node.isJSDocable(node)) {
			const jsDocs = node.getJsDocs()
			if (jsDocs.length > 0) {
				return jsDocs[jsDocs.length - 1]
			}
		}

		// For VariableDeclaration, check its VariableStatement ancestor
		if (Node.isVariableDeclaration(node)) {
			const variableStatement = node.getFirstAncestorByKind(SyntaxKind.VariableStatement)
			if (variableStatement && Node.isJSDocable(variableStatement)) {
				const jsDocs = variableStatement.getJsDocs()
				if (jsDocs.length > 0) {
					return jsDocs[jsDocs.length - 1]
				}
			}
		}

		return undefined
	}

	private getGroupName(jsDocNode: JSDoc | undefined): string | undefined {
		if (!jsDocNode) return undefined

		const groupTag = jsDocNode.getTags()
			.find(tag => tag.getTagName() === 'group')

		return groupTag?.getCommentText()?.trim()
	}

	private isInternalComponent(jsDocNode: JSDoc | undefined): boolean {
		if (!jsDocNode) return false

		return jsDocNode.getTags()
			.some(tag => tag.getTagName() === 'internal')
	}

	private getJSDocLinks(jsDocNode: JSDoc | undefined): string[] {
		if (!jsDocNode) return []

		const links: string[] = []
		const description = jsDocNode.getDescription() || ''
		const linkRegex = /{@link\s+([^}]+)}/g
		let match
		while ((match = linkRegex.exec(description)) !== null) {
			links.push(match[1].trim())
		}

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

	private parseSubComponentsAndHooks(jsdoc: string | undefined): { subComponents: string[]; hooks: string[] } {
		const result = {
			subComponents: [] as string[],
			hooks: [] as string[],
		}

		if (!jsdoc) return result

		// Find Sub-components section
		const subComponentsSectionRegex = /#+\s*Sub-components\s*([\s\S]*?)(?=#+|$)/
		const subComponentsMatch = jsdoc.match(subComponentsSectionRegex)

		if (subComponentsMatch && subComponentsMatch[1]) {
			const subComponentsSection = subComponentsMatch[1]
			const linkRegex = /{@link\s+([^}]+)}/g
			let match

			while ((match = linkRegex.exec(subComponentsSection)) !== null) {
				result.subComponents.push(match[1].trim())
			}
		}

		// Find Hooks section
		const hooksSectionRegex = /#+\s*Hooks\s*([\s\S]*?)(?=#+|$)/
		const hooksMatch = jsdoc.match(hooksSectionRegex)

		if (hooksMatch && hooksMatch[1]) {
			const hooksSection = hooksMatch[1]
			const linkRegex = /{@link\s+([^}]+)}/g
			let match

			while ((match = linkRegex.exec(hooksSection)) !== null) {
				result.hooks.push(match[1].trim())
			}
		}

		return result
	}

	private findLinkedPropsType(jsDocNode: JSDoc | undefined): string | undefined {
		if (!jsDocNode) return undefined

		const description = jsDocNode.getDescription() || ''
		const propsLinkRegex = /Props\s+{@link\s+([^}]+)}\s*\./
		const match = description.match(propsLinkRegex)

		if (match) return match[1]

		const altLinkRegex = /{@link\s+([^}]+Props)}/
		const altMatch = description.match(altLinkRegex)

		return altMatch ? altMatch[1] : undefined
	}

	private getJSDocExamples(jsDocNode: JSDoc | undefined): string[] {
		if (!jsDocNode) return []

		const examples = new Set<string>()
		const codeBlockRegex = /```(?:tsx?|jsx?|ts|js)?\s*([\s\S]*?)```/g

		jsDocNode.getTags()
			.filter((tag): tag is JSDocTag => tag.getTagName() === 'example')
			.forEach(tag => {
				const commentText = tag.getCommentText()?.trim()
				if (commentText) {
					examples.add(commentText)
				}
			})

		const mainComment = jsDocNode.getDescription()?.trim()
		if (mainComment) {
			const exampleHeadingRegex = /(#{1,6}\s*Example:.*?)(#{1,6}|$)/g
			let headingMatch

			while ((headingMatch = exampleHeadingRegex.exec(mainComment)) !== null) {
				const exampleSection = headingMatch[1].trim()
				if (exampleSection) {
					examples.add(exampleSection)
				}
			}

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
			const properties = declaration.getProperties()
			properties.forEach(property => {
				const name = property.getName()
				const type = property.getType().getText()
				const isOptional = property.hasQuestionToken()
				const jsDocNode = this.getJSDocNode(property)
				const description = jsDocNode?.getDescription()?.trim()

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
			const typeText = declaration.getTypeNode()?.getText() || ''

			if (typeText.startsWith('{')) {
				const typeMembers = declaration.getTypeNode()?.forEachChildAsArray() || []

				typeMembers.forEach(member => {
					if (Node.isPropertySignature(member)) {
						const name = member.getName()
						const type = member.getType().getText()
						const isOptional = member.hasQuestionToken()
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

					if (props[name]) continue

					let isOptional = false
					try {
						const valueDecl = prop.getValueDeclaration()
						if (valueDecl) {
							isOptional = valueDecl.getChildrenOfKind(SyntaxKind.QuestionToken).length > 0
						}
					} catch (err) {
						isOptional = false
					}

					let description: string | undefined

					try {
						const valueDecl = prop.getValueDeclaration()
						if (valueDecl && Node.isJSDocable(valueDecl)) {
							const jsDoc = valueDecl.getJsDocs()[0]
							description = jsDoc?.getDescription()?.trim()
						}
					} catch (err) {
						console.error(err)
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
