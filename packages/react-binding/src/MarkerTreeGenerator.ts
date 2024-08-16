import { BranchNode, ChildrenAnalyzer, Leaf, RawNodeRepresentation } from '@contember/react-multipass-rendering'
import type { ReactNode } from 'react'
import { BindingError } from '@contember/binding'
import { Environment } from '@contember/binding'
import {
	EntityFieldMarkersContainer,
	EntityFieldsWithHoistablesMarker,
	EntityListSubTreeMarker,
	EntitySubTreeMarker,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	MarkerTreeRoot,
} from '@contember/binding'
import type { Alias } from '@contember/binding'
import { IncrementalMarkerBuilder } from './core/IncrementalMarkerBuilder'

type Fragment = EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker
type Terminals = FieldMarker | HasOneRelationMarker | Fragment
type Nonterminals = HasOneRelationMarker | HasManyRelationMarker | Fragment

export class MarkerTreeGenerator {
	private static childrenAnalyzer = MarkerTreeGenerator.initializeChildrenAnalyzer()

	public constructor(private sourceTree: ReactNode, private environment: Environment = Environment.create()) {}

	public generate(): MarkerTreeRoot {
		const processed = MarkerTreeGenerator.childrenAnalyzer.processChildren(this.sourceTree, this.environment)

		if (processed.length === 0) {
			return new MarkerTreeRoot(new Map(), new Map())
		}

		const collectedMarkers = MarkerTreeGenerator.mapNodeResultToEntityFields(processed)

		if (collectedMarkers instanceof EntityFieldMarkersContainer) {
			throw new BindingError()
		}
		if (collectedMarkers.fields.markers.size) {
			throw new BindingError()
		}
		if (collectedMarkers.parentReference !== undefined) {
			throw new BindingError()
		}
		if (collectedMarkers.subTrees === undefined) {
			throw new BindingError()
		}

		const subTrees = collectedMarkers.subTrees

		return new MarkerTreeRoot(subTrees, this.generatePlaceholdersByAliases(subTrees))
	}

	private generatePlaceholdersByAliases(
		hoistedSubTrees: Map<string, EntitySubTreeMarker | EntityListSubTreeMarker>,
	): Map<Alias, string> {
		const placeholders = new Map<Alias, string>()

		for (const [placeholderName, subTree] of hoistedSubTrees) {
			const aliases = subTree.parameters.alias
			if (aliases === undefined || aliases.size === 0) {
				continue
			}
			for (const alias of aliases) {
				const existingPlaceholder = placeholders.get(alias)
				if (existingPlaceholder !== undefined) {
					if (existingPlaceholder === placeholderName) {
						continue
					}
					throw new BindingError(
						`Detected the same sub-tree alias '${alias}' referring to sub-trees with different parameters!`,
					)
				}
				placeholders.set(alias, placeholderName)
			}
		}

		return placeholders
	}

	private static mapNodeResultToEntityFields(
		result: RawNodeRepresentation<Terminals, Nonterminals>,
	): EntityFieldsWithHoistablesMarker | EntityFieldMarkersContainer {
		const builder = new IncrementalMarkerBuilder()

		if (!result) {
			return builder.getFinalMarker()
		}

		if (!Array.isArray(result)) {
			builder.mutateIn(result)
			return builder.getFinalMarker()
		}

		for (const marker of result) {
			builder.mutateIn(marker)
		}

		return builder.getFinalMarker()
	}

	private static initializeChildrenAnalyzer(): ChildrenAnalyzer<Terminals, Nonterminals, Environment> {
		const fieldMarkerLeaf = new Leaf<any, Environment>('generateLeafMarker')

		const branchMarkerBranchNode = new BranchNode<any, Environment>(
			'generateBranchMarker',
			this.mapNodeResultToEntityFields,
			{ childrenAreOptional: true },
		)

		return new ChildrenAnalyzer([fieldMarkerLeaf], [branchMarkerBranchNode], {
			staticRenderFactoryName: 'staticRender',
			renderPropsErrorMessage:
				`Render props (functions as React component children) are not supported within the schema. ` +
				`You have likely used a bare custom component as opposed to wrapping in with \`Component\` ` +
				`from the \`@contember/admin\` package. Please refer to the documentation.`,
			ignoreRenderProps: false,
			staticContextFactoryName: 'generateEnvironment',
		})
	}
}
