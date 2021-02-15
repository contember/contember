import { BranchNode, ChildrenAnalyzer, Leaf, RawNodeRepresentation } from '@contember/react-multipass-rendering'
import * as React from 'react'
import { BindingError } from '../BindingError'
import { Environment } from '../dao'
import {
	EntityFieldMarkersContainer,
	EntityListSubTreeMarker,
	EntitySubTreeMarker,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	MarkerTreeRoot,
} from '../markers'
import { MarkerFactory } from '../queryLanguage'
import { Alias } from '../treeParameters'
import { MarkerMerger } from './MarkerMerger'

type Fragment = EntityFieldMarkersContainer
type Terminals = FieldMarker | Fragment
type Nonterminals =
	| EntitySubTreeMarker
	| EntityListSubTreeMarker
	| HasOneRelationMarker
	| HasManyRelationMarker
	| Fragment

type NodeResult = Terminals | Nonterminals

export class MarkerTreeGenerator {
	private static childrenAnalyzer = MarkerTreeGenerator.initializeChildrenAnalyzer()

	public constructor(private sourceTree: React.ReactNode, private environment: Environment = Environment.create()) {}

	public generate(): MarkerTreeRoot {
		const processed = MarkerTreeGenerator.childrenAnalyzer.processChildren(this.sourceTree, this.environment)
		const subTreeMap: Map<string, EntitySubTreeMarker | EntityListSubTreeMarker> = new Map()

		if (processed.length === 0) {
			throw new BindingError('Empty data tree discovered. Try adding some fields…')
		}

		// TODO allow Fragment from here as well as handle it correctly from reportInvalidTopLevelError
		for (const marker of processed) {
			if (marker instanceof EntityListSubTreeMarker) {
				const presentSubTree = subTreeMap.get(marker.placeholderName)
				subTreeMap.set(
					marker.placeholderName,
					presentSubTree === undefined
						? marker
						: MarkerMerger.mergeEntityListSubTreeMarkers(presentSubTree as EntityListSubTreeMarker, marker),
				)
			} else if (marker instanceof EntitySubTreeMarker) {
				const presentSubTree = subTreeMap.get(marker.placeholderName)
				subTreeMap.set(
					marker.placeholderName,
					presentSubTree === undefined
						? marker
						: MarkerMerger.mergeEntitySubTreeMarkers(presentSubTree as EntitySubTreeMarker, marker),
				)
			} else {
				this.reportInvalidTopLevelError(marker)
			}
		}

		const hoistedSubTreeMap = this.hoistDeepSubTrees(subTreeMap)
		const placeholdersByAliases = this.generatePlaceholdersByAliases(hoistedSubTreeMap)

		return new MarkerTreeRoot(hoistedSubTreeMap, placeholdersByAliases)
	}

	private hoistDeepSubTrees(
		subTreeMap: Map<string, EntitySubTreeMarker | EntityListSubTreeMarker>,
	): Map<string, EntitySubTreeMarker | EntityListSubTreeMarker> {
		const hoistedMap: Map<string, EntitySubTreeMarker | EntityListSubTreeMarker> = new Map(subTreeMap)
		for (const [, subTree] of hoistedMap) {
			for (const nestedSubTree of this.hoistSubTeesFromEntityFields(subTree.fields)) {
				const presentSubTree = hoistedMap.get(nestedSubTree.placeholderName)
				hoistedMap.set(
					nestedSubTree.placeholderName,
					presentSubTree === undefined
						? nestedSubTree
						: presentSubTree instanceof EntityListSubTreeMarker
						? MarkerMerger.mergeEntityListSubTreeMarkers(presentSubTree, nestedSubTree as EntityListSubTreeMarker)
						: MarkerMerger.mergeEntitySubTreeMarkers(presentSubTree, nestedSubTree as EntitySubTreeMarker),
				)
			}
		}

		return hoistedMap
	}

	private *hoistSubTeesFromEntityFields(
		fields: EntityFieldMarkersContainer,
	): IterableIterator<EntitySubTreeMarker | EntityListSubTreeMarker> {
		for (const [placeholderName, marker] of fields.markers) {
			if (marker instanceof EntitySubTreeMarker || marker instanceof EntityListSubTreeMarker) {
				yield marker
				yield* this.hoistSubTeesFromEntityFields(marker.fields)
				fields.markers.delete(placeholderName)
			} else if (marker instanceof HasOneRelationMarker || marker instanceof HasManyRelationMarker) {
				yield* this.hoistSubTeesFromEntityFields(marker.fields)
			}
		}
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
	): EntityFieldMarkersContainer {
		let fieldsContainer: EntityFieldMarkersContainer = new EntityFieldMarkersContainer(false, new Map(), new Map())

		if (!result) {
			return fieldsContainer
		}

		if (!Array.isArray(result)) {
			result = [result]
		}

		for (const marker of result) {
			if (marker instanceof EntityFieldMarkersContainer) {
				fieldsContainer = MarkerMerger.mergeEntityFieldsContainers(fieldsContainer, marker)
			} else {
				fieldsContainer = MarkerMerger.mergeEntityFieldsContainers(
					fieldsContainer,
					MarkerFactory.createEntityFieldMarkersContainer(marker),
				)
			}
		}

		return fieldsContainer
	}

	private reportInvalidTopLevelError(
		marker: Exclude<NodeResult, EntitySubTreeMarker | EntityListSubTreeMarker>,
	): never {
		const kind = marker instanceof FieldMarker ? 'field' : 'relation'

		throw new BindingError(
			`Top-level ${kind} discovered. Any repeaters or similar components need to be used from within a data provider.`,
		)
	}

	private static initializeChildrenAnalyzer(): ChildrenAnalyzer<Terminals, Nonterminals, Environment> {
		const fieldMarkerLeaf = new Leaf<any, Environment>('generateFieldMarker')

		const subTreeMarkerBranchNode = new BranchNode<any, Environment>(
			'generateSubTreeMarker',
			this.mapNodeResultToEntityFields,
			{
				childrenAbsentErrorMessage: 'All data providers must have children',
			},
		)

		const referenceMarkerBranchNode = new BranchNode<any, Environment>(
			'generateRelationMarker',
			this.mapNodeResultToEntityFields,
			{
				childrenAbsentErrorMessage: 'All references must have children',
			},
		)

		return new ChildrenAnalyzer([fieldMarkerLeaf], [subTreeMarkerBranchNode, referenceMarkerBranchNode], {
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
