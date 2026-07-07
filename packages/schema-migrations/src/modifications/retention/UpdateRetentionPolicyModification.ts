import { Retention, Schema } from '@contember/schema'
import { SchemaUpdater } from '../utils/schemaUpdateUtils.js'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler.js'
import deepEqual from 'fast-deep-equal'

export class UpdateRetentionPolicyModificationHandler implements ModificationHandler<UpdateRetentionPolicyModificationData> {
	constructor(private readonly data: UpdateRetentionPolicyModificationData) {
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
					[this.data.name]: this.data.policy,
				},
			},
		})
	}

	describe() {
		return { message: `Update retention policy ${this.data.name}` }
	}
}

export interface UpdateRetentionPolicyModificationData {
	name: string
	policy: Retention.Policy
}

export const updateRetentionPolicyModification = createModificationType({
	id: 'updateRetentionPolicy',
	handler: UpdateRetentionPolicyModificationHandler,
})

export class UpdateRetentionPolicyDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.entries(updatedSchema.retention.policies)
			.filter(([name, policy]) => originalSchema.retention.policies[name] && !deepEqual(policy, originalSchema.retention.policies[name]))
			.map(([name, policy]) => updateRetentionPolicyModification.createModification({ name, policy }))
	}
}
