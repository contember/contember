import * as React from 'react'
import DataMarkerProvider from '../coreComponents/DataMarkerProvider'
import EntityMarker, { EntityFields } from '../dao/EntityMarker'
import FieldMarker from '../dao/FieldMarker'
import ReferenceMarker from '../dao/ReferenceMarker'

type NodeResult = FieldMarker | EntityMarker | ReferenceMarker
type RawNodeResult = NodeResult | NodeResult[] | undefined

export default class EntityTreeGenerator {
	public constructor(private sourceTree: React.ReactNode) {}

	public generate(): EntityMarker {
		const processed = this.processNode(this.sourceTree)

		let entityMarker: NodeResult | undefined = undefined

		if (!Array.isArray(processed)) {
			entityMarker = processed
		} else {
			if (processed.length === 1) {
				entityMarker = processed[0]
			}
		}

		if (entityMarker instanceof EntityMarker) {
			return entityMarker
		}
		return undefined
	}

	private processNode(node: React.ReactNode): RawNodeResult {
		if (!node || typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
			return undefined
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

			return mapped
		}

		let children: React.ReactNode

		if ('type' in node) {
			children = node.props.children

			if (!(typeof node.type === 'string')) {
				// React.Component
				const dataMarker = node.type as DataMarkerProvider & (React.ComponentClass<any> | React.SFC<any>)

				if ('generateFieldMarker' in dataMarker && dataMarker.generateFieldMarker) {
					return dataMarker.generateFieldMarker(node.props)
				}

				if ('generateFieldMarkers' in dataMarker && dataMarker.generateFieldMarkers) {
					return dataMarker.generateFieldMarkers(node.props)
				}

				if (children) {
					const processed = this.processNode(children)

					if ('generateEntityMarker' in dataMarker && dataMarker.generateEntityMarker) {
						return dataMarker.generateEntityMarker(node.props, this.mapNodeResultToEntityFields(processed))
					}

					if (
						'generateReferenceMarker' in dataMarker &&
						dataMarker.generateReferenceMarker &&
						processed instanceof EntityMarker
					) {
						return dataMarker.generateReferenceMarker(node.props, processed)
					}
				}

				return undefined
			}
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
				fields[marker.name] = marker
			} else if (marker instanceof ReferenceMarker) {
				fields[marker.name] = marker.reference
			} else {
				// Marker is an EntityMarker, which should not appear here. Throw error?
			}
		}

		return fields
	}
}
