import { CreateEvent, DeleteEvent, UpdateEvent } from './types'

export const appendUpdateSpecificData = <T>(commonData: T, event: UpdateEvent) => ({
	...commonData,
	tableName: event.tableName,
	primaryKey: event.rowId,
	diffValues: event.values,
	oldValues: {},
})

export const appendCreateSpecificData = <T>(commonData: T, event: CreateEvent) => ({
	...commonData,
	tableName: event.tableName,
	primaryKey: event.rowId,
	newValues: event.values,
})

export const appendDeleteSpecificData = <T>(commonData: T, event: DeleteEvent) => ({
	...commonData,
	tableName: event.tableName,
	primaryKey: event.rowId,
	oldValues: {},
})
