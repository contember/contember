import { MigrationBuilder } from '@contember/database-migrations'
import { Validation } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater } from '../schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'

export const UpdateValidationSchemaModification: ModificationHandlerStatic<UpdateValidationSchemaModificationData> = class {
	static id = 'updateValidationSchema'
	constructor(private readonly data: UpdateValidationSchemaModificationData) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		return schema => ({
			...schema,
			validation: this.data.schema,
		})
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}

	describe() {
		return { message: 'Update validation schema' }
	}

	static createModification(data: UpdateValidationSchemaModificationData) {
		return { modification: this.id, ...data }
	}
}

export interface UpdateValidationSchemaModificationData {
	schema: Validation.Schema
}
