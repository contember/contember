import { Column, ColumnTypeKind, Database, Domain, Table } from '../reflection/types'

const toCamelCase = (s: string) => s.replace(/(_[a-z])/g, (x, y) => y.substring(1).toUpperCase())
const ucFirst = (s: string) => s.substring(0, 1).toUpperCase() + s.substring(1)

const createEntityName = (s: string) => ucFirst(toCamelCase(s))
const createFieldName = (s: string) => toCamelCase(s)

export class ModelGenerator {

	constructor(
	) {
	}

	public generate(database: Database) {
		const entities = database.tables.filter(it => it.primaryKeys.length === 1).map(it => this.generateEntity(it, database))
		const enums = database.domains.filter(it => it.enumValues).map(it => this.generateEnumFromDomain(it))
		return `
import { SchemaDefinition as def } from '@contember/schema-definition'

${enums.join('\n\n')}

${entities.join('\n\n')}
`

	}

	private generateEnumFromDomain(domain: Domain): string {
		return `const ${domain.name} = def.createEnum(${domain.enumValues?.map(it => `'${it}'`).join(', ')})`
	}

	private generateEntity(table: Table, database: Database): string {
		const primary = table.columns.find(it => table.primaryKeys[0] === it.name)
		if (!primary) {
			throw 'Undefined primary column'
		}
		const code = `
export class ${createEntityName(table.name)} {
${this.getPrimaryColumnCode(primary)}
${table.columns.filter(it => it.name !== table.primaryKeys[0]).map(it => this.generateField(it, table, database)).join('\n')}
}`

		return code
	}

	private generateField(col: Column, table: Table, database: Database): string {
		const fk = table.foreignKeyConstraints.find(it => it.columns.length === 1 && it.columns[0] === col.name)
		const unique = table.uniqueConstraints.find(it => it.columns.length === 1 && it.columns[0] === col.name)
		const fieldName = createFieldName(col.name)
		if (fk) {
			if (unique) {
				return `	${fieldName} = def.oneHasOne(${createEntityName(fk.targetTable)})`
			} else {
				return `	${fieldName} = def.manyHasOne(${createEntityName(fk.targetTable)})`
			}
		}
		const colType = this.getColumnType(col, database)
		const notNullFlag = col.notNull ? `.notNull()` : ''
		return `	${fieldName} = def${colType}${notNullFlag}`
	}

	private getPrimaryColumnCode(primaryCol: Column): string {
		if (!this.isPrimaryDefault(primaryCol)) {
			throw 'Non-uuid primary columns are not yet supported'
		}
		return ''
	}

	private isPrimaryDefault(primaryCol: Column) {
		return primaryCol.type === 'uuid'
	}

	private getColumnType(col: Column, database: Database): string {
		switch (col.type) {
			case 'uuid':
				return '.uuidColumn()'
			case 'text':
				return '.stringColumn()'
			case 'int4':
				return '.intColumn()'
			case 'float8':
				return '.doubleColumn()'
			case 'bool':
				return '.booleanColumn()'
		}
		if (col.typeKind === ColumnTypeKind.domain) {
			const domain = database.domains.find(it => it.name === col.type)
			if (!domain) {
				throw `Undefined domain ${col.type}`
			}
			return `.enumColumn(${col.typeKind})`
		}
		console
		throw `Unsupported type ${col.type}`
	}
}

