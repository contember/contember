import { assertNever } from 'cms-common'
import * as React from 'react'
import MarkerProvider from '../coreComponents/MarkerProvider'
import DataBindingError from '../dao/DataBindingError'
import EntityFields from '../dao/EntityFields'
import FieldMarker from '../dao/FieldMarker'
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
			if (marker instanceof FieldMarker) {
				fields[marker.fieldName] = marker
			} else if (marker instanceof ReferenceMarker) {
				fields[marker.fieldName] = marker
			} else if (marker instanceof MarkerTreeRoot) {
				fields[marker.placeholderName] = marker
			} else {
				assertNever(marker)
			}
		}

		return fields
	}

	private reportInvalidTreeError(marker: FieldMarker | ReferenceMarker | undefined): never {
		if (marker) {
			const kind = marker instanceof FieldMarker ? 'field' : 'relation'

			throw new DataBindingError(
				`Top-level ${kind} discovered. Any repeaters or similar components need to be used from within an <Entity />.`,
			)
		}
		throw new DataBindingError('Empty form discovered. Try adding some fields…')
	}
}
