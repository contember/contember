import { Retention, Schema } from '@contember/schema'
import { SchemaUpdater } from '../utils/schemaUpdateUtils.js'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler.js'

export class CreateRetentionPolicyModificationHandler implements ModificationHandler<CreateRetentionPolicyModificationData> {
	constructor(private readonly data: CreateRetentionPolicyModificationData) {
	}

	public createSql(): void {
	}

	public getSchemaUpdater(): SchemaUpdater {
		return ({ schema }) => ({
			...schema,
			retention: {
				...schema.retention,
				policies: {
					...schema.retention.policies,
					[this.data.policy.name]: this.data.policy,
				},
			},
		})
	}

	describe() {
		return { message: `Create retention policy ${this.data.policy.name}` }
	}
}

export interface CreateRetentionPolicyModificationData {
	policy: Retention.Policy
}

export const createRetentionPolicyModification = createModificationType({
	id: 'createRetentionPolicy',
	handler: CreateRetentionPolicyModificationHandler,
})

export class CreateRetentionPolicyDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.entries(updatedSchema.retention.policies)
			.filter(([name]) => !originalSchema.retention.policies[name])
			.map(([, policy]) => createRetentionPolicyModification.createModification({ policy }))
	}
}
