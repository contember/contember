import { JSONValue } from '@contember/cli-common'
import { Migration, VERSION_INITIAL } from '@contember/schema-migrations'
import { MigrationFile } from './MigrationFile'

export class MigrationParser {
	public parse(migrationFile: MigrationFile, content: JSONValue): Migration {
		if (typeof content !== 'object' || content === null) {
			throw new Error('Invalid migration')
		}

		const validated = content as Migration // todo validate

		return {
			version: migrationFile.version,
			name: migrationFile.name,
			formatVersion: validated.formatVersion || VERSION_INITIAL,
			modifications: validated.modifications,
			...(validated.skippedErrors ? { skippedErrors: validated.skippedErrors } : {}),
		}

	}
}
