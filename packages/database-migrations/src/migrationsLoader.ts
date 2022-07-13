import fs from 'fs/promises'
import path, { join } from 'path'
import { Migration } from './Migration'

export const loadMigrations = async <Args>(sqlDir: string, additional: Migration<Args>[]): Promise<Migration<Args>[]> => {
	const migrationPromises = (await fs.readdir(sqlDir))
		.filter(it => path.extname(it) === '.sql')
		.map(async it => {
			const migrationContent = await fs.readFile(join(sqlDir, it), 'utf-8')
			return new Migration(path.basename(it, path.extname(it)), builder => builder.sql(migrationContent))
		})

	const sqlMigrations = await Promise.all(migrationPromises)

	return [...additional, ...sqlMigrations]
		.sort((a, b) => a.name.localeCompare(b.name))
}
