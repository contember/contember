import { Connection } from '@contember/database'
import { ColumnTypeKind, Database, Table } from './types'


export class ReflectionTool {
	constructor(
		private readonly connection: Connection.Queryable,
	) {
	}

	async getDatabaseSchema(schema: string): Promise<Database> {
		const tables = await this.listTables(schema)
		const domains = await this.fetchDomains(schema)
		return {
			tables,
			domains: domains.map(it => ({
				name: it.domain_name,
				baseType: it.base_type_name,
				baseTypeKind: it.base_type_type,
				enumValues: it.constraints.length === 1 ? this.parseConstraint(it.constraints[0]) : undefined,
			})),
		}
	}

	private async listTables(schemaName: string): Promise<Table[]> {
		const columnsResult = await this.fetchTables(schemaName)
		const columnsByTable: Record<string, ColumnRow[]> = {}
		for (const row of columnsResult) {
			(columnsByTable[row.table_name] ??= []).push(row)
		}
		const constraintsResult = await this.fetchConstraints(schemaName)
		const constraintsByTable: Record<string, ConstraintsRow[]> = {}
		for (const row of constraintsResult) {
			(constraintsByTable[row.table_name] ??= []).push(row)
		}

		const tables: Table[] = []
		for (const [tableName, columns] of Object.entries(columnsByTable)) {
			const tableConstraints = constraintsByTable[tableName] ?? []
			const primary = tableConstraints.filter(it => it.type === ConstraintTypes.primaryKey)
			if (primary.length === 0) {
				console.warn(`Table ${tableName} with no primary found, skipping`)
				continue
			}

			const fks = tableConstraints.filter(it => it.type === ConstraintTypes.foreignKey)
			const unique = tableConstraints.filter(it => it.type === ConstraintTypes.unique)
			tables.push({
				name: tableName,
				primaryKeys: primary[0].columns,
				columns: columns.map(it => ({
					name: it.column_name,
					notNull: it.is_not_null,
					type: it.type_name,
					typeKind: it.type_type,
				})),
				foreignKeyConstraints: fks.map(it => ({
					name: it.constraint_name,
					columns: it.columns,
					deferrable: it.deferrable,
					deferred: it.deferred,
					targetColumns: it.target_columns!,
					targetTable: it.target_table!,
				})),
				uniqueConstraints: unique.map(it => ({
					name: it.constraint_name,
					columns: it.columns,
				})),
			})
		}
		return tables
	}

	private async fetchTables(schemaName: string): Promise<ColumnRow[]> {
		return (await this.connection.query<ColumnRow>(`
			SELECT
				pg_attribute.attname AS column_name,
				pg_class.relname::TEXT AS table_name,
				pg_type.typname AS type_name,
				pg_type.typtype AS type_type,
				attnotnull AS is_not_null
			FROM pg_attribute
			JOIN pg_class
				ON pg_attribute.attrelid = pg_class.oid
			JOIN pg_namespace
				ON pg_class.relnamespace = pg_namespace.oid
			JOIN pg_type
				ON pg_attribute.atttypid = pg_type.oid
			WHERE nspname = ?
			  AND attnum > 0
			  AND pg_class.relkind = ANY (ARRAY ['r', 'p'])
			  AND NOT attisdropped
			ORDER BY pg_class.relname, attname
		`, [schemaName])).rows
	}

	private async fetchConstraints(schema: string): Promise<ConstraintsRow[]> {

		return (await this.connection.query<ConstraintsRow>(`
			SELECT
				pg_constraint.conname AS constraint_name,
				MAX(pg_class.relname) AS table_name,
				JSONB_AGG(DISTINCT pg_attribute.attname) AS columns,
				pg_constraint.contype AS type,
				MAX(pg_constraint_table.relname) AS target_table,
				JSONB_AGG(DISTINCT pg_attribute_target.attname)
				FILTER ( WHERE pg_attribute_target.attname IS NOT NULL) AS target_columns,
				condeferrable,
				condeferred
			FROM pg_constraint
			JOIN pg_class
				ON pg_constraint.conrelid = pg_class.oid
			JOIN pg_namespace
				ON pg_class.relnamespace = pg_namespace.oid
			JOIN pg_attribute
				ON pg_attribute.attrelid = pg_class.oid AND pg_attribute.attnum = ANY (pg_constraint.conkey)
			LEFT JOIN pg_attribute pg_attribute_target
				ON pg_constraint.confrelid = pg_attribute_target.attrelid AND
				   pg_attribute_target.attnum = ANY (pg_constraint.confkey)
			LEFT JOIN pg_class pg_constraint_table
				ON pg_constraint_table.oid = pg_constraint.confrelid
			WHERE pg_namespace.nspname = ? AND pg_constraint.contype = ANY (ARRAY ['p', 'f', 'u'])
			GROUP BY pg_constraint.oid
		`, [schema]))
			.rows
	}


	private async fetchDomains(schema: string): Promise<DomainRow[]> {
		return (await this.connection.query<DomainRow>(`
			SELECT
			    pg_type.typname domain_name,
			    COALESCE(JSONB_AGG(PG_GET_EXPR(conbin, 0)), '[]'::jsonb) AS constraints,
			    base.typname as base_type_name,
			    base.typtype as base_type_type
			FROM pg_type
			JOIN pg_namespace ON
				pg_type.typnamespace = pg_namespace.oid
			JOIN pg_type AS base ON pg_type.typbasetype = base.oid
			LEFT JOIN pg_constraint ON pg_constraint.contypid = pg_type.oid
			WHERE pg_type.typtype = 'd' AND nspname = ?
			GROUP BY pg_type.oid, base.oid;
		`, [schema])).rows
	}

	private parseConstraint(sql: string): string[] | undefined {
		const matchResult = sql.match(/^\(VALUE = (?:('\w+'::text)|ANY \(ARRAY\[('\w+'::text(?:, '\w+'::text)*)]\))\)$/)
		if (!matchResult) {
			console.warn(`Unknown domain constraint ${sql}`)
			return undefined
		}
		const valuesStr = matchResult[1] ?? matchResult[2]
		return Array.from(valuesStr.matchAll(/'(\w+)'::text/g)).map(it => it[1])
	}
}

enum ConstraintTypes {
	check = 'c',
	foreignKey = 'f',
	primaryKey = 'p',
	unique = 'u',
	trigger = 't',
	exclusion = 'x'
}

type ConstraintsRow = {
	constraint_name: string
	table_name: string
	columns: string[]
	target_table: string | null
	target_columns: null | string[]
	type: ConstraintTypes.unique | ConstraintTypes.foreignKey | ConstraintTypes.primaryKey
	deferrable: boolean
	deferred: boolean
}

type ColumnRow = {
	column_name: string
	table_name: string
	type_name: string
	type_type: ColumnTypeKind
	is_not_null: boolean
	primary_position: null | number
	referenced_table: string | null
}

type DomainRow = {
	domain_name: string
	base_type_name: string
	base_type_type: ColumnTypeKind
	constraints: string[]
}
