import { RelationFilter, TreeFilter } from '@contember/client'
import { EntityFieldMarkersContainer, HasManyRelationMarker, HasOneRelationMarker } from '../markers'
import { assertNever } from '../utils'
import { EntityState, RootStateNode, StateType } from './state'
import { TreeStore } from './TreeStore'

type RawRelationFilters = Map<string, RawRelationFilters>

export class TreeFilterGenerator {
	public constructor(private readonly treeStore: TreeStore) {}

	public generateTreeFilter(): TreeFilter[] {
		return Array.from(this.treeStore.markerTree.subTrees)
			.filter(([, tree]) => tree.parameters.value.expectedMutation !== 'none')
			.map(([placeholder]) => this.generateSubTreeFilter(this.treeStore.subTreeStates.get(placeholder)!))
			.flat()
	}

	private generateSubTreeFilter(subTree: RootStateNode): TreeFilter[] {
		const filters: TreeFilter[] = []

		switch (subTree.type) {
			case StateType.Entity: {
				const filter = this.generateTopLevelEntityFilter(subTree)
				filter && filters.push(filter)
				break
			}
			case StateType.EntityList: {
				for (const [, entityState] of subTree.children) {
					if (entityState.type === StateType.EntityStub) {
						// TODO this is *WRONG*.
						continue
					}
					const filter = this.generateTopLevelEntityFilter(entityState)
					filter && filters.push(filter)
				}
				break
			}
			default:
				return assertNever(subTree)
		}

		return filters
	}

	private generateTopLevelEntityFilter(topLevelEntity: EntityState): TreeFilter | undefined {
		const { id, typeName } = topLevelEntity

		if (!id.existsOnServer || typeName === undefined) {
			return undefined
		}
		return {
			entity: typeName,
			id: id.value,
			relations: this.generateEntityRelations(topLevelEntity.combinedMarkersContainer),
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
