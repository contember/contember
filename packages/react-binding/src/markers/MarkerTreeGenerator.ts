import type { ReactNode } from 'react'
import type { Alias } from '@contember/binding'
import {
	BindingError,
	EntityFieldMarkersContainer,
	EntityFieldsWithHoistablesMarker,
	EntityListSubTreeMarker,
	EntitySubTreeMarker,
	Environment,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	MarkerTreeRoot,
} from '@contember/binding'
import { MarkerStaticAnalyzer } from './MarkerStaticAnalyzer'

type Markers = FieldMarker | HasOneRelationMarker | EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker | HasManyRelationMarker

export class MarkerTreeGenerator {

	public constructor(private sourceTree: ReactNode, private environment: Environment = Environment.create()) {}

	public generate(): MarkerTreeRoot {
		const analyzer = new MarkerStaticAnalyzer()
		const collectedMarkers = analyzer.processChildren(this.sourceTree, this.environment)
		if (collectedMarkers === undefined) {
			return new MarkerTreeRoot(new Map(), new Map())
		}

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
		hoistedSubTrees: ReadonlyMap<string, EntitySubTreeMarker | EntityListSubTreeMarker>,
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

}
