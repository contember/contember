import { DatabaseContext } from '../utils/index.js'
import { CreateAuthLogEntryCommand } from '../commands/authLog/CreateAuthLogEntryCommand.js'
import { Response } from '../utils/Response.js'
import { AuthActionType } from '../type/AuthLog.js'
import { JSONValue } from '@contember/schema'

class AuthLogService {
	async logAuthAction(
		db: DatabaseContext,
		ctx: { identityId: string; clientIp?: string; userAgent?: string; forwarderIp?: string; forwarderUserAgent?: string },
		data: AuthLogService.LogArgs,
	): Promise<void> {
		const dataContainer = data.response.ok
			? data.response.result ?? {}
			: data.response.metadata ?? {}
		const authData = typeof dataContainer === 'object' && dataContainer !== null && AuthLogService.Key in dataContainer
			? dataContainer[AuthLogService.Key] as AuthLogService.Bag
			: undefined

		const baseMetadata = (data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata))
			? data.metadata as Record<string, JSONValue>
			: {}
		const metadata: Record<string, JSONValue> = { ...baseMetadata }
		if (ctx.forwarderIp !== undefined) {
			metadata.forwarderIp = ctx.forwarderIp
		}
		if (ctx.forwarderUserAgent !== undefined) {
			metadata.forwarderUserAgent = ctx.forwarderUserAgent
		}

		await db.commandBus.execute(
			new CreateAuthLogEntryCommand({
				success: data.response.ok,
				personInputIdentifier: data.personInput ?? authData?.data?.personInput,
				personId: data.personId ?? authData?.data?.personId,
				invokedById: ctx.identityId,
				type: data.type,
				identityProviderId: data.identityProviderId ?? authData?.data?.identityProviderId,
				errorCode: data.response.ok ? null : data.response.error,
				personTokenId: data.tokenId ?? authData?.data?.tokenId,
				errorMessage: data.response.ok ? undefined : data.response.errorMessage,
				ipAddress: ctx.clientIp,
				userAgent: ctx.userAgent,
				metadata,
				targetPersonId: data.targetPersonId,
				eventData: data.eventData,
			}),
		)
	}
}

namespace AuthLogService {
	export const Key = Symbol('AuthLogData')
	type Data = {
		personId?: string
		personInput?: string // e.g. email
		tokenId?: string
		identityProviderId?: string
		targetPersonId?: string
		metadata?: JSONValue
		eventData?: JSONValue
	}

	export type LogArgs = {
		response: Response<
			null | { [Key]?: Bag },
			any,
			{} | { [Key]?: Bag }
		>
		type: AuthActionType
	} & Data

	export class Bag {
		constructor(
			public readonly data: Data,
		) {
		}
	}
}

export { AuthLogService }
