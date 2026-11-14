/*
The SQL generation in this file is ported from the migration builder of node-pg-migrate. (https://github.com/salsita/node-pg-migrate)

The MIT License (MIT)

Copyright (c) 2016-2020 Salsita Software &lt;jando@salsitasoft.com&gt;

Copyright (c) 2014-2016 Theo Ephraim

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

// Collects the SQL of engine and content migrations. The output reproduces node-pg-migrate 5 byte for byte for the
// operations and options below, because not-yet-run migrations on existing databases must execute the same SQL.

export type Name = string | { schema?: string; name: string }

export type Value = null | boolean | string | number | readonly Value[]

export interface SequenceOptions {
	precedence: 'ALWAYS' | 'BY DEFAULT'
	start?: number
}

export interface ColumnDefinition {
	type: string
	collation?: string
	default?: Value
	unique?: boolean
	primaryKey?: boolean
	notNull?: boolean
	references?: Name
	onDelete?: string
	sequenceGenerated?: SequenceOptions
}

export interface AlterColumnOptions {
	type?: string
	collation?: string
	using?: string
	notNull?: boolean
	sequenceGenerated?: SequenceOptions | false
}

export interface TriggerOptions {
	when: 'BEFORE' | 'AFTER'
	operation: string | readonly string[]
	level?: 'ROW' | 'STATEMENT'
	function: Name
	functionParams?: readonly Value[]
	constraint?: boolean
	deferrable?: boolean
	deferred?: boolean
}

export interface FunctionParam {
	name: string
	type: string
}

const quote = (identifier: string): string => `"${identifier}"`

const literal = (name: Name): string => typeof name === 'object' ? (name.schema ? `${quote(name.schema)}.` : '') + quote(name.name) : quote(name)

const nextDollarTag = function*(): Generator<string> {
	const chars = 'abcdefghijklmnopqrstuvwxyz'
	const ids = [0]
	while (true) {
		yield `$pg${ids.map(id => chars[id]).join('')}$`
		let i = ids.length - 1
		for (; i >= 0; i--) {
			ids[i] += 1
			if (ids[i] < chars.length) {
				break
			}
			ids[i] = 0
		}
		if (i < 0) {
			ids.unshift(0)
		}
	}
}

export const escapeValue = (value: unknown): string | number => {
	if (value === null) {
		return 'NULL'
	}
	if (typeof value === 'boolean') {
		return value.toString()
	}
	if (typeof value === 'string') {
		for (const tag of nextDollarTag()) {
			if (!value.includes(tag)) {
				return `${tag}${value}${tag}`
			}
		}
	}
	if (typeof value === 'number') {
		return value
	}
	if (Array.isArray(value)) {
		return `ARRAY[${value.map(escapeValue).join(',').replace(/ARRAY/g, '')}]`
	}
	return ''
}

const typeAdapters: Record<string, string> = {
	int: 'integer',
	string: 'text',
	float: 'real',
	double: 'double precision',
	datetime: 'timestamp',
	bool: 'boolean',
}

const adaptType = (type: string): string => typeAdapters[type] ?? type

// `id` is node-pg-migrate's only default type shorthand; on columns it also implies a primary key.
const resolveType = (type: string): string => type === 'id' ? 'serial' : adaptType(type)

const applyColumnShorthand = (column: ColumnDefinition): ColumnDefinition =>
	column.type === 'id' ? { primaryKey: true, ...column, type: 'serial' } : { ...column, type: adaptType(column.type) }

const formatLines = (lines: readonly string[], prefix = '  ', separator = ','): string =>
	lines
		.map(line => line.replace(/(?:\r\n|\r|\n)+/g, ' '))
		.join(`${separator}\n`)
		.replace(/^/gm, prefix)

const sequenceClause = (sequence: SequenceOptions): string => {
	const options = sequence.start ? ` (START WITH ${sequence.start})` : ''
	return `GENERATED ${sequence.precedence} AS IDENTITY${options}`
}

const referencesClause = (column: ColumnDefinition & { references: Name }): string => {
	const { references, onDelete } = column
	const target = typeof references === 'string' && (references.startsWith('"') || references.endsWith(')')) ? references : literal(references)
	return `REFERENCES ${target}${onDelete ? ` ON DELETE ${onDelete}` : ''}`
}

const columnLines = (columns: Record<string, ColumnDefinition>): { lines: string[]; primaryKey: string[] } => {
	const applied = Object.entries(columns).map(([name, column]) => [name, applyColumnShorthand(column)] as const)
	const primaryKey = applied.filter(([, column]) => column.primaryKey).map(([name]) => name)
	const lines = applied.map(([name, column]) => {
		const constraints: string[] = []
		if (column.collation) {
			constraints.push(`COLLATE ${column.collation}`)
		}
		if (column.default !== undefined) {
			constraints.push(`DEFAULT ${escapeValue(column.default)}`)
		}
		if (column.unique) {
			constraints.push('UNIQUE')
		}
		if (column.primaryKey && primaryKey.length === 1) {
			constraints.push('PRIMARY KEY')
		}
		if (column.notNull) {
			constraints.push('NOT NULL')
		}
		if (column.references) {
			constraints.push(referencesClause({ ...column, references: column.references }))
		}
		if (column.sequenceGenerated) {
			constraints.push(sequenceClause(column.sequenceGenerated))
		}
		return `${literal(name)} ${column.type}${constraints.length ? ` ${constraints.join(' ')}` : ''}`
	})
	return { lines, primaryKey: primaryKey.length > 1 ? primaryKey : [] }
}

const tableNameOf = (table: Name): string => typeof table === 'object' ? table.name : table

export class MigrationBuilder {
	private readonly steps: string[] = []

	getSqlSteps(): string[] {
		return this.steps
	}

	getSql(): string {
		return `${this.steps.join('\n')}\n`
	}

	sql(sql: string): void {
		this.steps.push(sql.lastIndexOf(';') !== sql.length - 1 ? `${sql};` : sql)
	}

	createTable(table: Name, columns: Record<string, ColumnDefinition>): void {
		const { lines, primaryKey } = columnLines(columns)
		const definition = primaryKey.length > 0
			? [...lines, `CONSTRAINT ${literal(`${tableNameOf(table)}_pkey`)} PRIMARY KEY (${primaryKey.map(name => literal(name)).join(', ')})`]
			: lines
		this.steps.push(`CREATE TABLE ${literal(table)} (\n${formatLines(definition)}\n);`)
	}

	dropTable(table: Name): void {
		this.steps.push(`DROP TABLE ${literal(table)};`)
	}

	renameTable(table: Name, newName: Name): void {
		this.steps.push(`ALTER TABLE ${literal(table)} RENAME TO ${literal(newName)};`)
	}

	addColumn(table: Name, columns: Record<string, ColumnDefinition>): void {
		this.steps.push(`ALTER TABLE ${literal(table)}\n${formatLines(columnLines(columns).lines, '  ADD ')};`)
	}

	dropColumn(table: Name, column: string): void {
		this.steps.push(`ALTER TABLE ${literal(table)}\n${formatLines([literal(column)], '  DROP ')};`)
	}

	renameColumn(table: Name, column: string, newName: string): void {
		this.steps.push(`ALTER TABLE ${literal(table)} RENAME ${literal(column)} TO ${literal(newName)};`)
	}

	alterColumn(table: Name, column: string, options: AlterColumnOptions): void {
		const actions: string[] = []
		if (options.type) {
			const collation = options.collation ? ` COLLATE ${options.collation}` : ''
			const using = options.using ? ` USING ${options.using}` : ''
			actions.push(`SET DATA TYPE ${adaptType(options.type)}${collation}${using}`)
		}
		if (options.notNull) {
			actions.push('SET NOT NULL')
		} else if (options.notNull === false) {
			actions.push('DROP NOT NULL')
		}
		if (options.sequenceGenerated !== undefined) {
			actions.push(options.sequenceGenerated ? `ADD ${sequenceClause(options.sequenceGenerated)}` : 'DROP IDENTITY')
		}
		if (actions.length > 0) {
			this.steps.push(`ALTER TABLE ${literal(table)}\n${formatLines(actions, `  ALTER ${literal(column)} `)};`)
		} else {
			this.steps.push('')
		}
	}

	addConstraint(table: Name, constraintName: string | null, options: { primaryKey: readonly string[] }): void {
		const name = literal(constraintName || `${tableNameOf(table)}_pkey`)
		const constraint = `CONSTRAINT ${name} PRIMARY KEY (${options.primaryKey.map(column => literal(column)).join(', ')})`
		this.steps.push(`ALTER TABLE ${literal(table)}\n${formatLines([constraint], '  ADD ')};`)
	}

	dropConstraint(table: Name, constraintName: string): void {
		this.steps.push(`ALTER TABLE ${literal(table)} DROP CONSTRAINT ${literal(constraintName)};`)
	}

	createIndex(table: Name, columns: readonly string[], options: { name: string }): void {
		const columnsSql = columns.map(column => /[. ()]/.test(column) ? column : literal(column)).join(', ')
		this.steps.push(`CREATE INDEX ${literal(options.name)} ON ${literal(table)} (${columnsSql});`)
	}

	createDomain(domain: Name, type: string, options: { check: string; constraintName?: string }): void {
		const constraintName = options.constraintName ? ` CONSTRAINT ${literal(options.constraintName)}` : ''
		this.steps.push(`CREATE DOMAIN ${literal(domain)} AS ${resolveType(type)}${constraintName} CHECK (${options.check});`)
	}

	renameDomain(domain: Name, newName: Name): void {
		this.steps.push(`ALTER DOMAIN ${literal(domain)} RENAME TO ${literal(newName)};`)
	}

	dropDomain(domain: Name): void {
		this.steps.push(`DROP DOMAIN ${literal(domain)};`)
	}

	createView(view: Name, options: { replace?: boolean }, definition: string): void {
		this.steps.push(`CREATE${options.replace ? ' OR REPLACE' : ''} VIEW ${literal(view)} AS ${definition};`)
	}

	renameView(view: Name, newName: Name): void {
		this.steps.push(`ALTER VIEW ${literal(view)} RENAME TO ${literal(newName)};`)
	}

	dropView(view: Name): void {
		this.steps.push(`DROP VIEW ${literal(view)};`)
	}

	createMaterializedView(view: Name, options: { data?: boolean }, definition: string): void {
		const data = options.data !== undefined ? ` WITH${options.data ? '' : ' NO'} DATA` : ''
		this.steps.push(`CREATE MATERIALIZED VIEW ${literal(view)} AS ${definition}${data};`)
	}

	dropMaterializedView(view: Name): void {
		this.steps.push(`DROP MATERIALIZED VIEW ${literal(view)};`)
	}

	createTrigger(table: Name, trigger: string, options: TriggerOptions): void {
		const { constraint, deferrable, deferred, functionParams = [], level = 'STATEMENT' } = options
		const when = constraint ? 'AFTER' : options.when
		const operations = typeof options.operation === 'string' ? options.operation : options.operation.join(' OR ')
		if (!operations) {
			throw new Error('"operation" (INSERT/UPDATE[ OF ...]/DELETE/TRUNCATE) have to be specified')
		}
		if (!options.function) {
			throw new Error("Can't determine function name")
		}
		const defer = constraint ? `${deferrable ? `DEFERRABLE INITIALLY ${deferred ? 'DEFERRED' : 'IMMEDIATE'}` : 'NOT DEFERRABLE'}\n  ` : ''
		this.steps.push(
			`CREATE${constraint ? ' CONSTRAINT' : ''} TRIGGER ${literal(trigger)}\n`
				+ `  ${when} ${operations} ON ${literal(table)}\n`
				+ `  ${defer}FOR EACH ${level}\n`
				+ `  EXECUTE PROCEDURE ${literal(options.function)}(${functionParams.map(escapeValue).join(', ')});`,
		)
	}

	dropTrigger(table: Name, trigger: string, options: { ifExists?: boolean } = {}): void {
		this.steps.push(`DROP TRIGGER${options.ifExists ? ' IF EXISTS' : ''} ${literal(trigger)} ON ${literal(table)};`)
	}

	dropFunction(fn: Name, params: readonly FunctionParam[]): void {
		const paramsSql = params.map(param => `${literal(param.name)} ${resolveType(param.type)}`).join(', ')
		this.steps.push(`DROP FUNCTION ${literal(fn)}(${paramsSql});`)
	}
}
