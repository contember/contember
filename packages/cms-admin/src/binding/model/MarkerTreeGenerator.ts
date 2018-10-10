import { assertNever } from 'cms-common'
import * as React from 'react'
import { FieldName } from '../bindingTypes'
import MarkerProvider from '../coreComponents/MarkerProvider'
import DataBindingError from '../dao/DataBindingError'
import EntityFields from '../dao/EntityFields'
import FieldMarker from '../dao/FieldMarker'
import Marker from '../dao/Marker'
import MarkerTreeRoot from '../dao/MarkerTreeRoot'
import ReferenceMarker from '../dao/ReferenceMarker'

type NodeResult = FieldMarker | MarkerTreeRoot | ReferenceMarker
type RawNodeResult = NodeResult | NodeResult[] | undefined

export default class MarkerTreeGenerator {
	public constructor(private sourceTree: React.ReactNode) {}

	public generate(): MarkerTreeRoot {
		const processed = this.processNode(this.sourceTree)

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

	private processNode(node: React.ReactNode | Function): RawNodeResult {
		if (!node || typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
			return undefined
		}

		if (typeof node === 'function') {
			throw new DataBindingError(
				'Render props (functions as React Component children) are not supported within the schema. ' +
					'Please refer to the documentation.',
			)
		}

		if (Array.isArray(node)) {
			let mapped: NodeResult[] = []

			for (const subNode of node) {
				const processed = this.processNode(subNode)

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
				// React.Fragment or other non-component
				return this.processNode(children)
			}

			// React.Component

			const dataMarker = node.type as MarkerProvider & (React.ComponentClass<any> | React.SFC<any>)

			if ('generateSyntheticChildren' in dataMarker && dataMarker.generateSyntheticChildren) {
				children = dataMarker.generateSyntheticChildren(node.props)
			}

			if ('generateFieldMarker' in dataMarker && dataMarker.generateFieldMarker) {
				return dataMarker.generateFieldMarker(node.props)
			}

			if ('generateMarkerTreeRoot' in dataMarker && dataMarker.generateMarkerTreeRoot) {
				if (children) {
					return dataMarker.generateMarkerTreeRoot(
						node.props,
						this.mapNodeResultToEntityFields(this.processNode(children)),
					)
				}
				throw new DataBindingError(`Each ${node.type.displayName} component must have children.`)
			}

			if ('generateReferenceMarker' in dataMarker && dataMarker.generateReferenceMarker) {
				if (children) {
					return dataMarker.generateReferenceMarker(
						node.props,
						this.mapNodeResultToEntityFields(this.processNode(children)),
					)
				}
				throw new DataBindingError(`Each ${node.type.displayName} component must have children.`)
			}

			if (children) {
				return this.processNode(children)
			}

			return undefined
		} else if ('children' in node) {
			// React Portal
			children = node.children
		}

		return this.processNode(children)
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
				if (original.expectedCount === fresh.expectedCount) {
					for (const placeholderName in fresh.fields) {
						original.fields[placeholderName] =
							placeholderName in original.fields
								? this.mergeMarkers(original.fields[placeholderName], fresh.fields[placeholderName])
								: fresh.fields[placeholderName]
					}

					return original
				} else {
					throw new DataBindingError(`Cannot combine hasOne and hasMany relations for field '${original.fieldName}'.`)
				}
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

	private reportInvalidTreeError(marker: FieldMarker | ReferenceMarker | undefined): never {
		if (marker) {
			const kind = marker instanceof FieldMarker ? 'field' : 'relation'

			throw new DataBindingError(
				`Top-level ${kind} discovered. Any repeaters or similar components need to be used from within a data provider.`,
			)
		}
		throw new DataBindingError('Empty data tree discovered. Try adding some fields…')
	}

	private rejectRelationScalarCombo(fieldName: FieldName): never {
		throw new DataBindingError(`Cannot combine a relation with a scalar field '${fieldName}'.`)
	}
}
