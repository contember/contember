import { BranchNode, ChildrenAnalyzer, Leaf, RawNodeRepresentation } from '@contember/react-multipass-rendering'
import * as React from 'react'
import { BindingError } from '../BindingError'
import { Environment } from '../dao'
import {
	ConnectionMarker,
	EntityFieldMarkers,
	FieldMarker,
	Marker,
	SubTreeMarker,
	MarkerTreeRoot,
	ReferenceMarker,
} from '../markers'
import { FieldName } from '../treeParameters'
import { assertNever } from '../utils'

type Fragment = EntityFieldMarkers
type Terminals = FieldMarker | ConnectionMarker | Fragment
type Nonterminals = SubTreeMarker | ReferenceMarker | Fragment

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
								MarkerTreeGenerator.mergeEntityFields(presentSubTree.fields, nestedSubTree.fields),
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
			} else if (marker instanceof ReferenceMarker) {
				for (const alias in marker.references) {
					const reference = marker.references[alias]

					yield* this.hoistSubTeesFromEntityFields(reference.fields)
				}
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
						markerFromFields === undefined
							? innerMarker
							: MarkerTreeGenerator.mergeMarkers(markerFromFields, innerMarker),
					)
				}
			} else {
				const placeholderName = marker.placeholderName
				const markerFromFields = fields.get(placeholderName)
				fields.set(
					placeholderName,
					markerFromFields === undefined ? marker : MarkerTreeGenerator.mergeMarkers(markerFromFields, marker),
				)
			}
		}

		return fields
	}

	// This method assumes their placeholder names are the same
	private static mergeMarkers(original: Marker, fresh: Marker): Marker {
		if (original instanceof FieldMarker) {
			if (fresh instanceof FieldMarker) {
				if (original.isNonbearing !== fresh.isNonbearing && original.isNonbearing) {
					// If only one isNonbearing, then the whole field is bearing
					return fresh
				}
				// TODO warn in case of defaultValue differences
				return original
			} else if (fresh instanceof ReferenceMarker) {
				return MarkerTreeGenerator.rejectRelationScalarCombo(original.fieldName)
			} else if (fresh instanceof SubTreeMarker) {
				throw new BindingError('Merging fields and sub trees is an undefined operation.')
			} else if (fresh instanceof ConnectionMarker) {
				return MarkerTreeGenerator.rejectConnectionMarkerCombo(fresh)
			}
			assertNever(fresh)
		} else if (original instanceof ReferenceMarker) {
			if (fresh instanceof FieldMarker) {
				return MarkerTreeGenerator.rejectRelationScalarCombo(original.fieldName)
			} else if (fresh instanceof ReferenceMarker) {
				const newReferences = { ...original.references }
				for (const placeholderName in fresh.references) {
					const namePresentInOriginal = placeholderName in newReferences

					if (!namePresentInOriginal) {
						newReferences[placeholderName] = {
							placeholderName,
							fields: new Map(),
							filter: fresh.references[placeholderName].filter,
							reducedBy: fresh.references[placeholderName].reducedBy,
							expectedCount: fresh.references[placeholderName].expectedCount,
							preferences: fresh.references[placeholderName].preferences,
							isNonbearing: fresh.references[placeholderName].isNonbearing,
							hasAtLeastOneBearingField: fresh.references[placeholderName].hasAtLeastOneBearingField,
						}
					}

					// TODO what to do with preferences?
					newReferences[placeholderName].fields = namePresentInOriginal
						? MarkerTreeGenerator.mergeEntityFields(
								newReferences[placeholderName].fields,
								fresh.references[placeholderName].fields,
						  )
						: fresh.references[placeholderName].fields
				}
				return new ReferenceMarker(original.fieldName, newReferences)
			} else if (fresh instanceof ConnectionMarker) {
				return MarkerTreeGenerator.rejectConnectionMarkerCombo(fresh)
			} else if (fresh instanceof SubTreeMarker) {
				throw new BindingError('MarkerTreeGenerator merging: SubTreeMarkers can only be merged with other sub trees.')
			}
			assertNever(fresh)
		} else if (original instanceof ConnectionMarker) {
			if (
				fresh instanceof ConnectionMarker &&
				fresh.fieldName === original.fieldName &&
				JSON.stringify(fresh.target) === JSON.stringify(original.target)
			) {
				return original
			}
			return MarkerTreeGenerator.rejectConnectionMarkerCombo(original)
		} else if (original instanceof SubTreeMarker) {
			if (fresh instanceof SubTreeMarker) {
				return new SubTreeMarker(
					original.parameters,
					MarkerTreeGenerator.mergeEntityFields(original.fields, fresh.fields),
				)
			} else {
				throw new BindingError('MarkerTreeGenerator merging: SubTreeMarkers can only be merged with other sub trees.')
			}
		}
		assertNever(original)
	}

	private static mergeEntityFields(original: EntityFieldMarkers, fresh: EntityFieldMarkers): EntityFieldMarkers {
		for (const [placeholderName, freshMarker] of fresh) {
			const markerFromOriginal = original.get(placeholderName)
			original.set(
				placeholderName,
				markerFromOriginal === undefined
					? freshMarker
					: MarkerTreeGenerator.mergeMarkers(markerFromOriginal, freshMarker),
			)
		}
		return original
	}

	private reportInvalidTopLevelError(marker: Exclude<NodeResult, SubTreeMarker>): never {
		const kind = marker instanceof FieldMarker ? 'field' : marker instanceof ReferenceMarker ? 'relation' : 'connection'

		throw new BindingError(
			`Top-level ${kind} discovered. Any repeaters or similar components need to be used from within a data provider.`,
		)
	}

	private static rejectRelationScalarCombo(fieldName: FieldName): never {
		throw new BindingError(`Cannot combine a relation with a scalar field '${fieldName}'.`)
	}

	private static rejectConnectionMarkerCombo(connectionMarker: ConnectionMarker): never {
		throw new BindingError(`Attempting to combine a connection reference for field '${connectionMarker.fieldName}'.`)
	}

	private static initializeChildrenAnalyzer(): ChildrenAnalyzer<Terminals, Nonterminals, Environment> {
		const fieldMarkerLeaf = new Leaf<Environment>('generateFieldMarker')
		const connectionMarkerLeaf = new Leaf<Environment>('generateConnectionMarker')

		const subTreeMarkerBranchNode = new BranchNode<Environment>(
			'generateSubTreeMarker',
			MarkerTreeGenerator.mapNodeResultToEntityFields,
			{
				childrenAbsentErrorMessage: 'All data providers must have children',
			},
		)

		const referenceMarkerBranchNode = new BranchNode<Environment>(
			'generateReferenceMarker',
			MarkerTreeGenerator.mapNodeResultToEntityFields,
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
