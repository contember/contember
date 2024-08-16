import type { RelationFilter, TreeFilter } from '@contember/client'
import { EntityListPersistedData, ServerId } from '../accessorTree'
import {
	EntityFieldMarkersContainer,
	EntityListSubTreeMarker,
	EntitySubTreeMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
} from '../markers'
import type { EntityId, EntityName } from '../treeParameters'
import { assertNever } from '../utils'
import { StateIterator } from './state'
import type { TreeStore } from './TreeStore'

type RawRelationFilters = Map<string, RawRelationFilters>

export class TreeFilterGenerator {
	public constructor(private readonly treeStore: TreeStore) {}

	public generateTreeFilter(): TreeFilter[] {
		const filters: TreeFilter[][] = []

		for (const [placeholderName, state] of StateIterator.eachRootState(this.treeStore)) {
			const blueprint = state.blueprint

			if (blueprint.parent || blueprint.marker.parameters.expectedMutation === 'none') {
				continue
			}
			const marker = blueprint.marker
			filters.push(this.generateSubTreeFilter(marker, this.treeStore.subTreePersistedData.get(placeholderName)))
		}
		return filters.flat()
	}

	private generateSubTreeFilter(
		subTree: EntitySubTreeMarker | EntityListSubTreeMarker,
		persistedData: ServerId | EntityListPersistedData | undefined,
	): TreeFilter[] {
		const filters: TreeFilter[] = []

		if (persistedData === undefined) {
			return filters // Do nothing
		}

		if (persistedData instanceof ServerId) {
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
		id: EntityId,
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
			if (
				marker.parameters.expectedMutation === 'none' ||
				marker.parameters.expectedMutation === 'connectOrDisconnect'
			) {
				continue
			} else if (
				marker.parameters.expectedMutation === 'anyMutation' ||
				marker.parameters.expectedMutation === 'createOrDelete'
			) {
			} else {
				return assertNever(marker.parameters.expectedMutation)
			}
			let existingRelation = relations.get(marker.parameters.field)

			if (existingRelation === undefined) {
				relations.set(marker.parameters.field, (existingRelation = new Map()))
			}
			this.populateRawRelationFilters(marker.fields, existingRelation)
		}

		return relations
	}
}
