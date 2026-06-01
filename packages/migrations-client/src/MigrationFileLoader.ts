import { MigrationContent, MigrationFile } from './MigrationFile.js'

export interface MigrationFileLoader {
	load(file: MigrationFile): Promise<MigrationContent>
}
