import { Migration } from '@contember/schema-migrations'
import * as fs from 'node:fs/promises'

export type CoveredMigration = {
	version: string
	name: string
	type: 'schema' | 'content'
	/** schema migration checksum, or null for content migrations (mirrors the executed registry) */
	checksum: string | null
}

export type SnapshotFile = {
	/** last covered migration version (X) */
	version: string
	/** whether the project used schema state mode when the snapshot was created */
	stateMode: boolean
	/** collapsed schema (empty -> X), applied in a single step */
	snapshot: {
		formatVersion: number
		modifications: Migration.Modification[]
	}
	/** migrations subsumed by the snapshot, recorded as executed without replaying them */
	covers: CoveredMigration[]
	/** versions of content migrations within the covered range whose data is NOT reproduced */
	contentMigrations: string[]
}

export class SnapshotManager {
	constructor(private readonly snapshotPath: string) {}

	async exists(): Promise<boolean> {
		try {
			const stat = await fs.stat(this.snapshotPath)
			return stat.isFile()
		} catch {
			return false
		}
	}

	async read(): Promise<SnapshotFile> {
		try {
			const content = await fs.readFile(this.snapshotPath, 'utf8')
			return JSON.parse(content) as SnapshotFile
		} catch (e) {
			throw new Error(`Failed to read snapshot file ${this.snapshotPath}: ${e instanceof Error ? e.message : e}`)
		}
	}

	async write(snapshot: SnapshotFile): Promise<void> {
		await fs.writeFile(this.snapshotPath, JSON.stringify(snapshot, undefined, '\t') + '\n', 'utf8')
	}
}
