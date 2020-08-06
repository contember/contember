import { BranchNode, ChildrenAnalyzer, Leaf, RawNodeRepresentation } from '@contember/react-multipass-rendering'
import * as React from 'react'
import { BindingError } from '../BindingError'
import { Environment } from '../dao'
import {
	//EntityFieldMarkers,
	EntityFieldMarkersContainer,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	MarkerTreeRoot,
	SubTreeMarker,
} from '../markers'
import { MarkerFactory } from '../queryLanguage'
import { MarkerMerger } from './MarkerMerger'

type Fragment = EntityFieldMarkersContainer
type Terminals = FieldMarker | Fragment
type Nonterminals = SubTreeMarker | HasOneRelationMarker | HasManyRelationMarker | Fragment

type NodeResult = Terminals | Nonterminals

export class MarkerTreeGenerator {
	private static childrenAnalyzer = MarkerTreeGenerator.initializeChildrenAnalyzer()

	public constructor(private sourceTree: React.ReactNode, private environment: Environment = Environment.create()) {}

	public generate(): MarkerTreeRoot {
		const processed = MarkerTreeGenerator.childrenAnalyzer.processChildren(this.sourceTree, this.environment)
		const subTreeMap: Map<string, SubTreeMarker> = new Map()

		if (processed.length === 0) {
			throw new BindingError('Empty data tree discovered. Try adding some fields…')
		}

		// TODO allow Fragment from here as well as handle it correctly from reportInvalidTopLevelError
		for (const marker of processed) {
			if (marker instanceof SubTreeMarker) {
				const presentSubTree = subTreeMap.get(marker.placeholderName)
				subTreeMap.set(
					marker.placeholderName,
					presentSubTree === undefined ? marker : MarkerMerger.mergeSubTreeMarkers(presentSubTree, marker),
				)
			} else {
				this.reportInvalidTopLevelError(marker)
			}
		}

		return new MarkerTreeRoot(this.hoistDeepSubTrees(subTreeMap))
	}

	private hoistDeepSubTrees(subTreeMap: Map<string, SubTreeMarker>): Map<string, SubTreeMarker> {
		const hoistedMap: Map<string, SubTreeMarker> = new Map(subTreeMap)
		for (const [, subTree] of hoistedMap) {
			for (const nestedSubTree of this.hoistSubTeesFromEntityFields(subTree.fields)) {
				const presentSubTree = hoistedMap.get(nestedSubTree.placeholderName)
				hoistedMap.set(
					nestedSubTree.placeholderName,
					presentSubTree === undefined
						? nestedSubTree
						: MarkerMerger.mergeSubTreeMarkers(presentSubTree, nestedSubTree),
				)
			}
		}

		return hoistedMap
	}

	private *hoistSubTeesFromEntityFields(fields: EntityFieldMarkersContainer): Generator<SubTreeMarker, void> {
		for (const [placeholderName, marker] of fields.markers) {
			if (marker instanceof SubTreeMarker) {
				yield marker
				yield* this.hoistSubTeesFromEntityFields(marker.fields)
				fields.markers.delete(placeholderName)
			} else if (marker instanceof HasOneRelationMarker || marker instanceof HasManyRelationMarker) {
				yield* this.hoistSubTeesFromEntityFields(marker.fields)
			}
		}
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

	private reportInvalidTopLevelError(marker: Exclude<NodeResult, SubTreeMarker>): never {
		const kind = marker instanceof FieldMarker ? 'field' : 'relation'

		throw new BindingError(
			`Top-level ${kind} discovered. Any repeaters or similar components need to be used from within a data provider.`,
		)
	}

	private static initializeChildrenAnalyzer(): ChildrenAnalyzer<Terminals, Nonterminals, Environment> {
		const fieldMarkerLeaf = new Leaf<Environment>('generateFieldMarker')

		const subTreeMarkerBranchNode = new BranchNode<Environment>(
			'generateSubTreeMarker',
			this.mapNodeResultToEntityFields,
			{
				childrenAbsentErrorMessage: 'All data providers must have children',
			},
		)

		const referenceMarkerBranchNode = new BranchNode<Environment>(
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
