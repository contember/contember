import { MigrationBuilder } from '@contember/database-migrations'
import { Schema, Settings } from '@contember/schema'
import { SchemaUpdater } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import deepEqual from 'fast-deep-equal'

export class UpdateSettingsModificationHandler implements ModificationHandler<UpdateSettingsModificationData> {
	constructor(
		private readonly data: UpdateSettingsModificationData,
	) {
	}

	public createSql(builder: MigrationBuilder): void {
	}

	public getSchemaUpdater(): SchemaUpdater {
		return ({ schema }) => {
			const { [this.data.key]: _, ...settings } = schema.settings
			if (this.data.op === 'unset') {
				return {
					...schema,
					settings,
				}
			}
			return {
				...schema,
				settings: { ...settings, [this.data.key]: this.data.value },
			}
		}
	}


	describe() {
		return { message: `Change settings of ${this.data.key}` }
	}

}

export const updateSettingsModification = createModificationType({
	id: 'updateSettings',
	handler: UpdateSettingsModificationHandler,
})

export class UpdateSettingsDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		const allKeys = Array.from(new Set([
			...Object.keys(originalSchema.settings),
			...Object.keys(updatedSchema.settings),
		] as (keyof Settings.Schema)[]))

		return allKeys
			.filter(key => !deepEqual(originalSchema.settings[key], updatedSchema.settings[key]))
			.map(key => {
				const value = updatedSchema.settings[key]
				if (value === undefined) {
					return updateSettingsModification.createModification({
						op: 'unset',
						key,
					})
				}
				return updateSettingsModification.createModification({
					op: 'set',
					key,
					value,
				})
			})
	}
}



export interface SetSettingsModificationData<K extends keyof Settings.Schema = keyof Settings.Schema> {
	op: 'set'
	key: K
	value: Settings.Schema[K]
}


export interface UnsetSettingsModificationData<K extends keyof Settings.Schema = keyof Settings.Schema> {
	op: 'unset'
	key: K
}


export type UpdateSettingsModificationData =
	| SetSettingsModificationData
	| UnsetSettingsModificationData
