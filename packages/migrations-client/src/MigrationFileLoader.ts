import { MigrationContent, MigrationFile } from './MigrationFile'

export interface MigrationFileLoader {
	load(file: MigrationFile): Promise<MigrationContent>
}
