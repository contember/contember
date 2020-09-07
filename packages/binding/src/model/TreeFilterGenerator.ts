import { RelationFilter, TreeFilter } from '@contember/client'
import { EntityFieldMarkersContainer, HasManyRelationMarker, HasOneRelationMarker, MarkerTreeRoot } from '../markers'
import { assertNever } from '../utils'
import { InternalEntityState, InternalRootStateNode, InternalStateType } from './internalState'

type RawRelationFilters = Map<string, RawRelationFilters>

export class TreeFilterGenerator {
	public constructor(
		private readonly markerTree: MarkerTreeRoot,
		private readonly subTreeStates: Map<string, InternalRootStateNode>,
		private readonly entityStore: Map<string, InternalEntityState>,
	) {}

	public generateTreeFilter(): TreeFilter[] {
		return Array.from(this.markerTree.subTrees)
			.filter(([, tree]) => tree.parameters.value.expectedMutation !== 'none')
			.map(([placeholder]) => this.generateSubTreeFilter(this.subTreeStates.get(placeholder)!))
			.flat()
	}

	private generateSubTreeFilter(subTree: InternalRootStateNode): TreeFilter[] {
		const filters: TreeFilter[] = []

		switch (subTree.type) {
			case InternalStateType.SingleEntity: {
				const filter = this.generateTopLevelEntityFilter(subTree)
				filter && filters.push(filter)
				break
			}
			case InternalStateType.EntityList: {
				for (const entityKey of subTree.childrenKeys) {
					const entity = this.entityStore.get(entityKey)
					if (entity === undefined) {
						continue
					}
					const filter = this.generateTopLevelEntityFilter(entity)
					filter && filters.push(filter)
				}
				break
			}
			default:
				return assertNever(subTree)
		}

		return filters
	}

	private generateTopLevelEntityFilter(topLevelEntity: InternalEntityState): TreeFilter | undefined {
		const { id, typeName } = topLevelEntity

		if (typeof id !== 'string' || typeName === undefined) {
			return undefined
		}
		return {
			entity: typeName,
			id,
			relations: this.generateEntityRelations(topLevelEntity.markersContainer),
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
			const existingRelation = relations.get(marker.relation.field)

			if (existingRelation === undefined) {
				relations.set(marker.relation.field, new Map())
			} else {
				this.populateRawRelationFilters(marker.fields, existingRelation)
			}
		}

		return relations
	}
}
