import {
	ForeignKeyConstraintMetadata,
	IndexMetadata,
	SchemaDatabaseMetadata,
	UniqueConstraintMetadata,
} from '@contember/schema-utils'
import { DatabaseContext } from '../database'
import { Connection } from '@contember/database'
import { ResolvedDatabaseMetadata } from './ResolvedDatabaseMetadata'

export class SchemaDatabaseMetadataResolver {
	async resolveMetadata(db: DatabaseContext, contentSchema: string): Promise<SchemaDatabaseMetadata> {
		const constraintRows = await this.fetchConstraints(db.client, contentSchema)
		const indexRows = await this.fetchIndexes(db.client, contentSchema)

		const fkConstraints = constraintRows
			.filter((it): it is ForeignKeyConstraintsRow => it.type === ConstraintTypes.foreignKey)
			.map((it): ForeignKeyConstraintMetadata => ({
				constraintName: it.constraint_name,
				fromColumn: it.columns[0],
				toColumn: it.target_columns[0],
				fromTable: it.table_name,
				toTable: it.target_table,
			}))
		const uniqueConstraints = constraintRows
			.filter((it): it is UniqueConstraintsRow => it.type === ConstraintTypes.unique)
			.map((it): UniqueConstraintMetadata => ({
				constraintName: it.constraint_name,
				tableName: it.table_name,
				columnNames: it.columns,
			}))
		const indexes = indexRows
			.map((it): IndexMetadata => ({
				indexName: it.index_name,
				tableName: it.table_name,
				columnNames: it.columns,
			}))

		return new ResolvedDatabaseMetadata(
			fkConstraints,
			uniqueConstraints,
			indexes,
		)
	}

	private async fetchConstraints(connection: Connection.Queryable, schema: string): Promise<ConstraintsRow[]> {
		return (await connection.query<ConstraintsRow>(`
            SELECT
                MAX(pg_constraint.conname) AS constraint_name,
                MAX(pg_class.relname) AS table_name,
                JSONB_AGG(DISTINCT pg_attribute.attname) AS columns,
                MAX(pg_constraint.contype) AS type,
                MAX(pg_constraint_table.relname) AS target_table,
                JSONB_AGG(DISTINCT pg_attribute_target.attname)
                FILTER ( WHERE pg_attribute_target.attname IS NOT NULL) AS target_columns,
                BOOL_OR(condeferrable),
                BOOL_OR(condeferred)
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
            WHERE pg_namespace.nspname = ?
              AND pg_constraint.contype = ANY (ARRAY ['f', 'u'])
            GROUP BY pg_constraint.oid
		`, [schema]))
			.rows
	}

	private async fetchIndexes(connection: Connection.Queryable, schema: string): Promise<IndexRow[]> {
		return (await connection.query<IndexRow>(`
            SELECT
                MAX(idx_class.relname) AS index_name,
                MAX(table_class.relname) AS table_name,
                JSONB_AGG(DISTINCT pg_attribute.attname) AS columns
            FROM pg_index
            JOIN pg_class AS table_class
                ON pg_index.indrelid = table_class.oid
            JOIN pg_class AS idx_class
                ON pg_index.indexrelid = idx_class.oid
            JOIN pg_namespace
                ON table_class.relnamespace = pg_namespace.oid
            JOIN pg_attribute
                ON pg_attribute.attrelid = table_class.oid AND pg_attribute.attnum = ANY (pg_index.indkey)
            WHERE pg_namespace.nspname = ?
              AND indisprimary = FALSE
              AND indisunique = FALSE
            GROUP BY pg_index.indexrelid
		`, [schema]))
			.rows
	}
}

enum ConstraintTypes {
	foreignKey = 'f',
	unique = 'u',
}

type ConstraintsRow =
	| ForeignKeyConstraintsRow
	| UniqueConstraintsRow

type ForeignKeyConstraintsRow = {
	constraint_name: string
	table_name: string
	columns: string[]
	target_table: string
	target_columns: string[]
	type: ConstraintTypes.foreignKey
	deferrable: boolean
	deferred: boolean
}
type UniqueConstraintsRow = {
	constraint_name: string
	table_name: string
	columns: string[]
	target_table: null
	target_columns: null
	type: ConstraintTypes.unique
	deferrable: boolean
	deferred: boolean
}

type IndexRow = {
	index_name: string
	table_name: string
	columns: string[]
}

