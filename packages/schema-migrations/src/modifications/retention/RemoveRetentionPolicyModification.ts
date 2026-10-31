import { Schema } from '@contember/schema'
import { SchemaUpdater } from '../utils/schemaUpdateUtils.js'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler.js'

export class RemoveRetentionPolicyModificationHandler implements ModificationHandler<RemoveRetentionPolicyModificationData> {
	constructor(private readonly data: RemoveRetentionPolicyModificationData) {
	}

	public createSql(): void {
	}

	public getSchemaUpdater(): SchemaUpdater {
		return ({ schema }) => {
			const { [this.data.name]: _, ...policies } = schema.retention.policies
			return ({
				...schema,
				retention: {
					...schema.retention,
					policies,
				},
			})
		}
	}

	describe() {
		return { message: `Remove retention policy ${this.data.name}` }
	}
}

export interface RemoveRetentionPolicyModificationData {
	name: string
}

export const removeRetentionPolicyModification = createModificationType({
	id: 'removeRetentionPolicy',
	handler: RemoveRetentionPolicyModificationHandler,
})

export class RemoveRetentionPolicyDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.entries(originalSchema.retention.policies)
			.filter(([name]) => !updatedSchema.retention.policies[name])
			.map(([name]) => removeRetentionPolicyModification.createModification({ name }))
	}
}
