import { unnamedIdentity } from '@contember/engine-system-api'
import { CreateEvent, DeleteEvent, UpdateEvent } from '@contember/engine-common'
import { testUuid } from './testUuid'

export const createCreateEvent = (rowId: string, tableName: string, values: { [column: string]: any }) =>
	new CreateEvent(testUuid(1), new Date(), new Date(), unnamedIdentity, testUuid(2), [rowId], tableName, values)

export const createUpdateEvent = (rowId: string, tableName: string, values: { [column: string]: any }) =>
	new UpdateEvent(testUuid(1), new Date(), new Date(), unnamedIdentity, testUuid(2), [rowId], tableName, values)

export const createDeleteEvent = (rowId: string, tableName: string) =>
	new DeleteEvent(testUuid(1), new Date(), new Date(), unnamedIdentity, testUuid(2), [rowId], tableName)
