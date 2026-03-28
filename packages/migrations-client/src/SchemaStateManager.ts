import { Acl, Actions, Schema, Settings, Validation } from '@contember/schema'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

export type SchemaState = {
	acl: Acl.Schema
	validation: Validation.Schema
	actions: Actions.Schema
	settings: Settings.Schema
}

const stateFiles = ['acl', 'validation', 'actions', 'settings'] as const
type StateKey = typeof stateFiles[number]

export class SchemaStateManager {
	constructor(private readonly stateDir: string) {}

	async isStateMode(): Promise<boolean> {
		try {
			const stat = await fs.stat(this.stateDir)
			return stat.isDirectory()
		} catch {
			return false
		}
	}

	async readState(): Promise<SchemaState> {
		const state: Partial<SchemaState> = {}
		for (const key of stateFiles) {
			const filePath = path.join(this.stateDir, `${key}.json`)
			try {
				const content = await fs.readFile(filePath, 'utf8')
				state[key] = JSON.parse(content)
			} catch (e) {
				throw new Error(`Failed to read schema state file ${filePath}: ${e instanceof Error ? e.message : e}`)
			}
		}
		return state as SchemaState
	}

	async writeState(state: SchemaState, { dryRun = false }: { dryRun?: boolean } = {}): Promise<boolean> {
		let changed = false
		for (const key of stateFiles) {
			const filePath = path.join(this.stateDir, `${key}.json`)
			const newContent = JSON.stringify(state[key], undefined, '\t') + '\n'
			let currentContent: string | null = null
			try {
				currentContent = await fs.readFile(filePath, 'utf8')
			} catch {
				// file doesn't exist yet
			}
			if (currentContent !== newContent) {
				if (!dryRun) {
					await fs.writeFile(filePath, newContent, 'utf8')
				}
				changed = true
			}
		}
		return changed
	}

	async extractState(schema: Schema): Promise<void> {
		await fs.mkdir(this.stateDir, { recursive: true })
		await this.writeState(SchemaStateManager.schemaStateFromSchema(schema))
	}

	static schemaStateFromSchema(schema: Schema): SchemaState {
		return {
			acl: schema.acl,
			validation: schema.validation,
			actions: schema.actions,
			settings: schema.settings,
		}
	}
}
