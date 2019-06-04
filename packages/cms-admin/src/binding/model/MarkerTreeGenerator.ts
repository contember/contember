import { assertNever } from 'cms-common'
import * as React from 'react'
import { FieldName } from '../bindingTypes'
import { MarkerProvider } from '../coreComponents'
import {
	DataBindingError,
	EntityFields,
	Environment,
	FieldMarker,
	Marker,
	MarkerTreeRoot,
	ReferenceMarker
} from '../dao'

type NodeResult = FieldMarker | MarkerTreeRoot | ReferenceMarker
type RawNodeResult = NodeResult | NodeResult[] | undefined

export class MarkerTreeGenerator {
	public constructor(
		private sourceTree: React.ReactNode,
		private environment: Environment = new Environment({
			dimensions: {}
		})
	) {}

	public generate(): MarkerTreeRoot {
		const processed = this.processNode(this.sourceTree, this.environment)

		let result: NodeResult | undefined = undefined

		if (!Array.isArray(processed)) {
			result = processed
		} else {
			if (processed.length === 1) {
				result = processed[0]
			}
		}

		if (result instanceof MarkerTreeRoot) {
			return result
		}

		return this.reportInvalidTreeError(result)
	}

	private processNode(node: React.ReactNode | Function, environment: Environment): RawNodeResult {
		if (!node || typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
			return undefined
		}

		if (typeof node === 'function') {
			throw new DataBindingError(
				'Render props (functions as React Component children) are not supported within the schema. ' +
					'Please refer to the documentation.'
			)
		}

		if (Array.isArray(node)) {
			let mapped: NodeResult[] = []

			for (const subNode of node) {
				const processed = this.processNode(subNode, environment)

				if (processed) {
					if (Array.isArray(processed)) {
						mapped = mapped.concat(processed)
					} else {
						mapped.push(processed)
					}
				}
			}

			if (mapped.length === 1) {
				return mapped[0]
			}

			return mapped
		}

		let children: React.ReactNode

		if ('type' in node) {
			children = node.props.children

			if (typeof node.type === 'symbol' || typeof node.type === 'string') {
				// React.Fragment, React.Portal or other non-component
				return this.processNode(children, environment)
			}

			// React.Component

			const dataMarker = node.type as MarkerProvider &
				(React.ComponentClass<unknown> | React.FunctionComponent<unknown> | React.NamedExoticComponent<unknown>)

			if ('generateEnvironmentDelta' in dataMarker && dataMarker.generateEnvironmentDelta) {
				const delta = dataMarker.generateEnvironmentDelta(node.props, environment)
				environment = environment.putDelta(delta)
			}

			if ('generateSyntheticChildren' in dataMarker && dataMarker.generateSyntheticChildren) {
				children = dataMarker.generateSyntheticChildren(node.props, environment)
			}

			if ('generateFieldMarker' in dataMarker && dataMarker.generateFieldMarker) {
				return dataMarker.generateFieldMarker(node.props, environment)
			}

			if ('generateMarkerTreeRoot' in dataMarker && dataMarker.generateMarkerTreeRoot) {
				if (children) {
					return dataMarker.generateMarkerTreeRoot(
						node.props,
						this.mapNodeResultToEntityFields(this.processNode(children, environment)),
						environment
					)
				}
				throw new DataBindingError(`Each ${dataMarker.displayName} component must have children.`)
			}

			if ('generateReferenceMarker' in dataMarker && dataMarker.generateReferenceMarker) {
				if (children) {
					const referenceMarker = dataMarker.generateReferenceMarker(
						node.props,
						this.mapNodeResultToEntityFields(this.processNode(children, environment)),
						environment
					)

					for (const placeholderName in referenceMarker.references) {
						const reference = referenceMarker.references[placeholderName]
						if (reference.reducedBy) {
							const fields = Object.keys(reference.reducedBy)

							if (fields.length !== 1) {
								// TODO this will change in future
								throw new DataBindingError(`Relation can only be reduced by exactly one field.`)
							}
						}
					}

					return referenceMarker
				}
				throw new DataBindingError(`Each ${dataMarker.displayName} component must have children.`)
			}

			if (children) {
				return this.processNode(children, environment)
			}

			return undefined
		}

		return this.processNode(children, environment)
	}

	private mapNodeResultToEntityFields(result: RawNodeResult): EntityFields {
		const fields: EntityFields = {}

		if (!result) {
			return fields
		}

		if (!Array.isArray(result)) {
			result = [result]
		}

		for (const marker of result) {
			const placeholderName = marker.placeholderName

			fields[placeholderName] = placeholderName in fields ? this.mergeMarkers(fields[placeholderName], marker) : marker
		}

		return fields
	}

	// This method assumes their placeholder names are the same
	private mergeMarkers(original: Marker, fresh: Marker): Marker {
		if (original instanceof FieldMarker) {
			if (fresh instanceof FieldMarker) {
				return original
			} else if (fresh instanceof ReferenceMarker) {
				return this.rejectRelationScalarCombo(original.fieldName)
			} else if (fresh instanceof MarkerTreeRoot) {
				throw new DataBindingError() // TODO msg
			} else {
				return assertNever(fresh)
			}
		} else if (original instanceof ReferenceMarker) {
			if (fresh instanceof FieldMarker) {
				return this.rejectRelationScalarCombo(original.fieldName)
			} else if (fresh instanceof ReferenceMarker) {
				for (const placeholderName in fresh.references) {
					const namePresentInOriginal = placeholderName in original.references

					if (!namePresentInOriginal) {
						original.references[placeholderName] = {
							placeholderName,
							fields: {},
							filter: fresh.references[placeholderName].filter,
							reducedBy: fresh.references[placeholderName].reducedBy,
							expectedCount: fresh.references[placeholderName].expectedCount
						}
					}

					original.references[placeholderName].fields = namePresentInOriginal
						? this.mergeEntityFields(
								original.references[placeholderName].fields,
								fresh.references[placeholderName].fields
						  )
						: fresh.references[placeholderName].fields
				}
				return original
			} else if (fresh instanceof MarkerTreeRoot) {
				throw new DataBindingError() // TODO msg
			} else {
				return assertNever(fresh)
			}
		} else if (original instanceof MarkerTreeRoot) {
			throw new DataBindingError() // TODO msg
		} else {
			return assertNever(original)
		}
	}

	private mergeEntityFields(original: EntityFields, fresh: EntityFields): EntityFields {
		for (const placeholderName in fresh) {
			original[placeholderName] =
				placeholderName in original
					? this.mergeMarkers(original[placeholderName], fresh[placeholderName])
					: fresh[placeholderName]
		}
		return original
	}

	private reportInvalidTreeError(marker: FieldMarker | ReferenceMarker | undefined): never {
		if (marker) {
			const kind = marker instanceof FieldMarker ? 'field' : 'relation'

			throw new DataBindingError(
				`Top-level ${kind} discovered. Any repeaters or similar components need to be used from within a data provider.`
			)
		}
		throw new DataBindingError('Empty data tree discovered. Try adding some fields…')
	}

	private rejectRelationScalarCombo(fieldName: FieldName): never {
		throw new DataBindingError(`Cannot combine a relation with a scalar field '${fieldName}'.`)
	}
}
