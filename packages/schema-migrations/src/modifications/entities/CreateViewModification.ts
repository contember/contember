import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateModel } from '../utils/schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'
import { Migration } from '../../Migration'
import { PartialEntity } from '../../utils/PartialEntity.js'

export const CreateViewModification: ModificationHandlerStatic<CreateViewModificationData> = class {
	static id = 'createView'
	constructor(private readonly data: CreateViewModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.data.entity
		if (!entity.migrations.enabled) {
			return
		}
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

	static createModification(data: CreateViewModificationData) {
		return { modification: this.id, ...data }
	}

	static createDiff(originalSchema: Schema, updatedSchema: Schema) {
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
			modifications.push(CreateViewModification.createModification({
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
