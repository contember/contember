import { AnyEvent, ContentEvent, CreateEvent, DeleteEvent, UpdateEvent } from '@contember/engine-common'

export const appendUpdateSpecificData = <T>(commonData: T, event: UpdateEvent) => ({
	...commonData,
	tableName: event.tableName,
	primaryKeys: event.rowId,
	diffValues: event.values,
	oldValues: {},
})

export const appendCreateSpecificData = <T>(commonData: T, event: CreateEvent) => ({
	...commonData,
	tableName: event.tableName,
	primaryKeys: event.rowId,
	newValues: event.values,
})

export const appendDeleteSpecificData = <T>(commonData: T, event: DeleteEvent) => ({
	...commonData,
	tableName: event.tableName,
	primaryKeys: event.rowId,
	oldValues: {},
})
