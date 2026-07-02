import { Model } from '@contember/schema'

export interface AuditLogColumnSpec {
	readonly name: string
	readonly types: readonly Model.ColumnType[]
	readonly required: boolean
}

/**
 * Canonical shape of an audit-log sink entity (the entity an `auditLog` target
 * writes into). Single source of truth shared by the schema validator (checks a
 * hand-written entity is compatible) and the `@AuditLog` entity generator (emits
 * exactly these columns). Columns the writer tolerates as absent are `required: false`.
 */
export const auditLogColumns: readonly AuditLogColumnSpec[] = [
	{ name: 'transactionId', types: [Model.ColumnType.Uuid], required: true },
	{ name: 'rootEntity', types: [Model.ColumnType.String], required: true },
	{ name: 'rootId', types: [Model.ColumnType.Uuid, Model.ColumnType.String], required: true },
	{ name: 'data', types: [Model.ColumnType.Json], required: true },
	{ name: 'eventNo', types: [Model.ColumnType.Int], required: false },
	{ name: 'identityId', types: [Model.ColumnType.Uuid], required: false },
	{ name: 'trigger', types: [Model.ColumnType.String], required: false },
	{ name: 'nodes', types: [Model.ColumnType.Json], required: false },
	{ name: 'createdAt', types: [Model.ColumnType.DateTime], required: false },
]
