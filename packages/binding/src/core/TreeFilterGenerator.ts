import { RelationFilter, TreeFilter } from '@contember/client'
import { EntityListPersistedData, ServerGeneratedUuid } from '../accessorTree'
import {
	EntityFieldMarkersContainer,
	HasManyRelationMarker,
	HasOneRelationMarker,
	EntitySubTreeMarker,
	EntityListSubTreeMarker,
} from '../markers'
import { EntityName } from '../treeParameters'
import { assertNever } from '../utils'
import { TreeStore } from './TreeStore'

type RawRelationFilters = Map<string, RawRelationFilters>

export class TreeFilterGenerator {
	public constructor(private readonly treeStore: TreeStore) {}

	public generateTreeFilter(): TreeFilter[] {
		return Array.from(this.treeStore.markerTree.subTrees)
			.filter(([, tree]) => tree.parameters.expectedMutation !== 'none')
			.map(([placeholderName, tree]) =>
				this.generateSubTreeFilter(tree, this.treeStore.subTreePersistedData.get(placeholderName)),
			)
			.flat()
	}

	private generateSubTreeFilter(
		subTree: EntitySubTreeMarker | EntityListSubTreeMarker,
		persistedData: ServerGeneratedUuid | EntityListPersistedData | undefined,
	): TreeFilter[] {
		const filters: TreeFilter[] = []

		if (persistedData === undefined || subTree.parameters.isCreating) {
			return filters // Do nothing
		}

		if (persistedData instanceof ServerGeneratedUuid) {
			const filter = this.generateTopLevelEntityFilter(
				persistedData.value,
				subTree.parameters.entityName,
				subTree.fields,
			)
			filter && filters.push(filter)
		} else {
			for (const id of persistedData) {
				const filter = this.generateTopLevelEntityFilter(id, subTree.parameters.entityName, subTree.fields)
				filter && filters.push(filter)
			}
		}

		return filters
	}

	private generateTopLevelEntityFilter(
		id: string,
		entityName: EntityName,
		fields: EntityFieldMarkersContainer,
	): TreeFilter | undefined {
		return {
			entity: entityName,
			id: id,
			relations: this.generateEntityRelations(fields),
		}
	}

	private generateEntityRelations(markers: EntityFieldMarkersContainer): RelationFilter[] {
		const rawFilter = this.populateRawRelationFilters(markers)
		return this.normalizeRawRelationFilters(rawFilter)
	}

	private normalizeRawRelationFilters(raw: RawRelationFilters): RelationFilter[] {
		return Array.from(raw, ([fieldName, relations]) => ({
			name: fieldName,
			relations: this.normalizeRawRelationFilters(relations),
		}))
	}

	private populateRawRelationFilters(
		markers: EntityFieldMarkersContainer,
		relations: RawRelationFilters = new Map(),
	): RawRelationFilters {
		for (const [, marker] of markers.markers) {
			if (!(marker instanceof HasOneRelationMarker) && !(marker instanceof HasManyRelationMarker)) {
				continue
			}
			if (marker.relation.expectedMutation === 'none' || marker.relation.expectedMutation === 'connectOrDisconnect') {
				continue
			} else if (
				marker.relation.expectedMutation === 'anyMutation' ||
				marker.relation.expectedMutation === 'createOrDelete'
			) {
			} else {
				return assertNever(marker.relation.expectedMutation)
			}
			let existingRelation = relations.get(marker.relation.field)

			if (existingRelation === undefined) {
				relations.set(marker.relation.field, (existingRelation = new Map()))
			}
			this.populateRawRelationFilters(marker.fields, existingRelation)
		}

		return relations
	}
}
