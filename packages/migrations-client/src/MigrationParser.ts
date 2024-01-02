import { Migration, VERSION_INITIAL } from '@contember/schema-migrations'
import { ContentMigrationQuery, MigrationFile, ResolvedMigrationContent } from './MigrationFile'
import { JSONValue } from './utils/json'

export class MigrationParser {
	public parse(migrationFile: MigrationFile, content: JSONValue): ResolvedMigrationContent {
		if (typeof content !== 'object' || content === null) {
			throw new Error('Invalid migration')
		}

		if ('modifications' in content) {
			const validated = content as Migration // todo validate

			return {
				type: 'schema',
				version: migrationFile.version,
				name: migrationFile.name,
				formatVersion: validated.formatVersion || VERSION_INITIAL,
				modifications: validated.modifications,
				...(validated.skippedErrors ? { skippedErrors: validated.skippedErrors } : {}),
			}
		} else if ('queries' in content || 'query' in content) {
			return {
				type: 'content',
				version: migrationFile.version,
				name: migrationFile.name,
				queries: ('queries' in content ? content.queries : [content]) as ContentMigrationQuery[],
			}
		}
		throw new Error('Invalid migration content')
	}
}
