import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateModel } from '../schemaUpdateUtils'
import { Modification } from '../Modification'
import { escapeSqlString } from '../../utils/escapeSqlString'

class CreateEnumModification implements Modification<CreateEnumModification.Data> {
	constructor(private readonly data: CreateEnumModification.Data, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const joinedValues = this.data.values.map(it => `'${escapeSqlString(it)}'`).join(',')
		builder.createDomain(this.data.enumName, 'text', {
			check: `VALUE IN(${joinedValues})`,
			constraintName: `${this.data.enumName}_check`,
		})
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(model => ({
			...model,
			enums: {
				...model.enums,
				[this.data.enumName]: this.data.values,
			},
		}))
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}

	describe() {
		return { message: `Add enum ${this.data.enumName}` }
	}
}

namespace CreateEnumModification {
	export const id = 'createEnum'

	export interface Data {
		enumName: string
		values: string[]
	}
}

export default CreateEnumModification
