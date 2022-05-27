import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import { Migration } from '../../Migration'
import { PartialEntity } from '../../utils/PartialEntity.js'

export class CreateViewModificationHandler implements ModificationHandler<CreateViewModificationData> {
	constructor(protected readonly data: CreateViewModificationData, protected readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.data.entity
		if (!entity.view) {
			throw new Error()
		}
		builder.createView(entity.tableName, {}, entity.view.sql)
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(({ model }) => ({
			...model,
			entities: {
				...model.entities,
				[this.data.entity.name]: {
					indexes: {},
					eventLog: { enabled: true }, // not relevant here...
					...this.data.entity,
				},
			},
		}))
	}


	describe() {
		return { message: `Add view ${this.data.entity.name}` }
	}
}

export const createViewModification = createModificationType({
	id: 'createView',
	handler: CreateViewModificationHandler,
})

export class CreateViewDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		const newViews = Object.values(updatedSchema.model.entities)
			.filter(it => !originalSchema.model.entities[it.name])
			.filter(it => !!it.view)
		const created = new Set<string>()
		const modifications: Migration.Modification[] = []
		const cascadeCreate = (entity: Model.Entity) => {
			if (originalSchema.model.entities[entity.name] || created.has(entity.name)) {
				return
			}
			created.add(entity.name)
			for (const dependency of entity.view?.dependencies ?? []) {
				cascadeCreate(updatedSchema.model.entities[dependency])
			}
			modifications.push(createViewModification.createModification({
				entity: entity,
			}))
		}
		for (const view of newViews) {
			cascadeCreate(view)
		}
		return modifications
	}
}

export interface CreateViewModificationData {
	entity: PartialEntity
}
