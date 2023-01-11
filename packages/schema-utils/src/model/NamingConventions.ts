export interface NamingConventions {
	getPrimaryField(): string

	getColumnName(fieldName: string): string

	getTableName(entityName: string): string

	getJoiningColumnName(relationName: string): string

	getJoiningTableName(entity: string, relation: string): string

	getJoiningTableColumnNames(
		owningEntity: string,
		owningRelation: string,
		inverseEntity: string,
		inverseRelation?: string,
	): [string, string]
}

const toUnderscore = (s: string) => s.replace(/([A-Z]+)/g, (x, y) => '_' + y.toLowerCase()).replace(/^_/, '')
export class DefaultNamingConventions implements NamingConventions {
	getPrimaryField(): string {
		return 'id'
	}

	getColumnName(fieldName: string): string {
		return toUnderscore(fieldName)
	}

	getTableName(entityName: string): string {
		return toUnderscore(entityName)
	}

	getJoiningColumnName(relationName: string): string {
		return toUnderscore(relationName) + '_id'
	}

	getJoiningTableName(entity: string, relation: string): string {
		return toUnderscore(entity) + '_' + toUnderscore(relation)
	}

	getJoiningTableColumnNames(
		owningEntity: string,
		owningRelation: string,
		inverseEntity: string,
		inverseRelation?: string,
	): [string, string] {
		return [
			toUnderscore(owningEntity) + '_id',
			toUnderscore(inverseEntity === owningEntity ? owningRelation : inverseEntity) + '_id',
		]
	}
}
