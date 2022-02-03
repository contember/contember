import fs from 'fs/promises'
import path, { join } from 'path'
import { Migration } from './Migration'

export const loadMigrations = async (sqlDir: string, additional: Migration[]): Promise<Migration[]> => {
	return (
		await Promise.all(
			(
				await fs.readdir(sqlDir)
			)
				.filter(it => path.extname(it) === '.sql')
				.map(async it => {
					const migrationContent = await fs.readFile(join(sqlDir, it), 'utf-8')
					return new Migration(path.basename(it, path.extname(it)), builder => builder.sql(migrationContent))
				}),
		)
	)
		.concat(additional)
		.sort((a, b) => a.name.localeCompare(b.name))
}
