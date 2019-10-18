import { MigrationBuilder } from 'node-pg-migrate'
import { Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateModel } from '../schemaUpdateUtils'
import { Modification } from '../Modification'
import { escapeSqlString } from '../../utils/escapeSqlString'

class UpdateEnumModification implements Modification<UpdateEnumModification.Data> {
	constructor(private readonly data: UpdateEnumModification.Data, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const joinedValues = this.data.values.map(it => `'${escapeSqlString(it)}'`).join(',')
		builder.sql(`ALTER DOMAIN "${this.data.enumName}" DROP CONSTRAINT ${this.data.enumName}_check`)
		builder.sql(
			`ALTER DOMAIN "${this.data.enumName}" ADD CONSTRAINT ${this.data.enumName}_check CHECK (VALUE IN(${joinedValues}))`,
		)
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
}

namespace UpdateEnumModification {
	export const id = 'updateEnum'

	export interface Data {
		enumName: string
		values: string[]
	}
}

export default UpdateEnumModification
