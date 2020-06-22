import { BranchNode, ChildrenAnalyzer, Leaf, RawNodeRepresentation } from '@contember/react-multipass-rendering'
import * as React from 'react'
import { BindingError } from '../BindingError'
import { Environment } from '../dao'
import {
	ConnectionMarker,
	EntityFieldMarkers,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	Marker,
	MarkerTreeRoot,
	SubTreeMarker,
} from '../markers'
import { FieldName } from '../treeParameters'
import { assertNever } from '../utils'
import { MarkerMerger } from './MarkerMerger'

type Fragment = EntityFieldMarkers
type Terminals = FieldMarker | ConnectionMarker | Fragment
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
				subTreeMap.set(marker.placeholderName, marker)
			} else {
				this.reportInvalidTopLevelError(marker)
			}
		}

		return new MarkerTreeRoot(this.hoistDeepSubTrees(subTreeMap))
	}

	private hoistDeepSubTrees(subTreeMap: Map<string, SubTreeMarker>): Map<string, SubTreeMarker> {
		const hoistedMap: Map<string, SubTreeMarker> = new Map()
		for (const [placeholderName, subTree] of subTreeMap) {
			hoistedMap.set(placeholderName, subTree)
			for (const nestedSubTree of this.hoistSubTeesFromEntityFields(subTree.fields)) {
				const presentSubTree = hoistedMap.get(nestedSubTree.placeholderName)
				hoistedMap.set(
					nestedSubTree.placeholderName,
					presentSubTree === undefined
						? nestedSubTree
						: new SubTreeMarker(
								nestedSubTree.parameters,
								MarkerMerger.mergeEntityFields(presentSubTree.fields, nestedSubTree.fields),
						  ),
				)
			}
		}

		return hoistedMap
	}

	private *hoistSubTeesFromEntityFields(fields: EntityFieldMarkers): Generator<SubTreeMarker, void> {
		for (const [placeholderName, marker] of fields) {
			if (marker instanceof SubTreeMarker) {
				yield marker
				yield* this.hoistSubTeesFromEntityFields(marker.fields)
				fields.delete(placeholderName)
			} else if (marker instanceof HasOneRelationMarker || marker instanceof HasManyRelationMarker) {
				yield* this.hoistSubTeesFromEntityFields(marker.fields)
			}
		}
	}

	private static mapNodeResultToEntityFields(
		result: RawNodeRepresentation<Terminals, Nonterminals>,
	): EntityFieldMarkers {
		const fields: EntityFieldMarkers = new Map()

		if (!result) {
			return fields
		}

		if (!Array.isArray(result)) {
			result = [result]
		}

		for (const marker of result) {
			if (marker instanceof Map) {
				for (const [placeholderName, innerMarker] of marker) {
					const markerFromFields = fields.get(placeholderName)
					fields.set(
						placeholderName,
						markerFromFields === undefined ? innerMarker : MarkerMerger.mergeMarkers(markerFromFields, innerMarker),
					)
				}
			} else {
				const placeholderName = marker.placeholderName
				const markerFromFields = fields.get(placeholderName)
				fields.set(
					placeholderName,
					markerFromFields === undefined ? marker : MarkerMerger.mergeMarkers(markerFromFields, marker),
				)
			}
		}

		return fields
	}

	private reportInvalidTopLevelError(marker: Exclude<NodeResult, SubTreeMarker>): never {
		const kind =
			marker instanceof FieldMarker
				? 'field'
				: marker instanceof HasOneRelationMarker || marker instanceof HasManyRelationMarker
				? 'relation'
				: 'connection'

		throw new BindingError(
			`Top-level ${kind} discovered. Any repeaters or similar components need to be used from within a data provider.`,
		)
	}

	private static initializeChildrenAnalyzer(): ChildrenAnalyzer<Terminals, Nonterminals, Environment> {
		const fieldMarkerLeaf = new Leaf<Environment>('generateFieldMarker')
		const connectionMarkerLeaf = new Leaf<Environment>('generateConnectionMarker')

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

		return new ChildrenAnalyzer(
			[fieldMarkerLeaf, connectionMarkerLeaf],
			[subTreeMarkerBranchNode, referenceMarkerBranchNode],
			{
				syntheticChildrenFactoryName: 'generateSyntheticChildren',
				renderPropsErrorMessage:
					`Render props (functions as React component children) are not supported within the schema. ` +
					`You have likely used a bare custom component as opposed to wrapping in with \`Component\` ` +
					`from the \`@contember/admin\` package. Please refer to the documentation.`,
				ignoreRenderProps: false,
				environmentFactoryName: 'generateEnvironment',
			},
		)
	}
}
