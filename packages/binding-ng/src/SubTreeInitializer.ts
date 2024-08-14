import {
	assertNever,
	BindingError,
	EntityFieldMarkers,
	EntityListSubTreeMarker,
	EntitySubTreeMarker,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	MarkerTreeRoot,
	ReceivedDataTree,
	ReceivedEntityData,
	Schema,
	ServerId,
} from '@contember/binding-common'
import { QueryGenerator } from './QueryGenerator'
import { Entity } from './entities/Entity'
import { EntityStore } from './entities/EntityStore'
import { EntityAccessorStore } from './accessors/EntityAccessorStore'


export class SubTreeInitializer {
	constructor(
		private readonly schema: Schema,
		private readonly entityStore: EntityStore,
		private readonly entityAccessorStore: EntityAccessorStore,
	) {
	}


	public receiveData(markerTreeRoot: MarkerTreeRoot, data: ReceivedDataTree): void {
		for (const markerTree of markerTreeRoot.subTrees.values()) {
			if (markerTree instanceof EntityListSubTreeMarker) {
				this.initializeEntityListSubTree(markerTree, data[markerTree.placeholderName])
			} else if (markerTree instanceof EntitySubTreeMarker) {
				this.initializeEntitySubTree(markerTree, data[markerTree.placeholderName])
			} else {
				assertNever(markerTree)
			}
		}
	}

	private initializeEntityListSubTree(marker: EntityListSubTreeMarker, data: ReceivedDataTree[string] | undefined): void {
		if (marker.parameters.isCreating !== (data === undefined)) {
			throw new BindingError('Unexpected entity data')
		}
		if (!Array.isArray(data)) {
			throw new BindingError('Expected array, got object')
		}

		const entities = data?.map(row => this.processEntityData(marker.fields.markers, row))
			?? Array.from({ length: marker.parameters.initialEntityCount }).map(() => this.entityStore.createNewEntity(marker.entityName))

		this.entityAccessorStore.initializeEntityListSubTree({ entities, marker })
	}

	private initializeEntitySubTree(marker: EntitySubTreeMarker, data: ReceivedDataTree[string] | undefined): void {
		if (marker.parameters.isCreating !== (data === undefined)) {
			throw new BindingError('Unexpected entity data')
		}
		if (Array.isArray(data)) {
			throw new BindingError('Expected object, got array')
		}
		const entity = data
			? this.processEntityData(marker.fields.markers, data)
			: this.entityStore.createNewEntity(marker.entityName)

		this.entityAccessorStore.initializeEntitySubTree({ entity: entity, marker: marker })
	}

	private processEntityData(fields: EntityFieldMarkers, data: ReceivedEntityData): Entity {
		const entityName = data.__typename
		const id = data.id
		if (!id) {
			throw new BindingError('Entity data missing id')
		}

		const entity = this.entityStore.getOrCreatePersistedEntity(entityName, new ServerId(id, entityName))

		for (const [placeholder, field] of fields) {
			const value = data[placeholder]

			if (field instanceof FieldMarker) {

				entity.setFieldPersistedValue({
					fieldName: field.fieldName,
					value,
				})

			} else if (field instanceof HasOneRelationMarker) {

				const matches = value !== null
				let childEntity = value === null ? null : this.processEntityData(field.fields.markers, value as ReceivedEntityData)

				if (childEntity === null) {
					const stubAlias = QueryGenerator.getStubAlias(placeholder)
					childEntity = data[stubAlias]
						? this.processEntityData(field.fields.markers, data[stubAlias] as ReceivedEntityData)
						: null
				}

				entity.setHasOneRelationPersistedValue({
					entity: childEntity,
					matches,
					relation: field.parameters,
				})


			} else if (field instanceof HasManyRelationMarker) {
				const entities = (value as ReceivedEntityData[]).map(row => this.processEntityData(field.fields.markers, row))

				entity.setHasManyRelationPersistedValue({
					relation: field.parameters,
					value: entities,
				})
			} else {
				throw new Error()
			}
		}
		return entity
	}
}
