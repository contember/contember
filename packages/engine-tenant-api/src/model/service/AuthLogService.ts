import { DatabaseContext } from '../utils'
import { CreateAuthLogEntryCommand } from '../commands/authLog/CreateAuthLogEntryCommand'
import { Response } from '../utils/Response'
import { AuthActionType } from '../type/AuthLog'

class AuthLogService {
	async logAuthAction(
		db: DatabaseContext,
		ctx: { identityId: string; clientIp?: string; userAgent?: string },
		data: AuthLogService.LogArgs,
	): Promise<void> {
		const dataContainer = data.response.ok
			? data.response.result ?? {}
			: data.response.metadata ?? {}
		const authData = typeof dataContainer === 'object' && dataContainer !== null && AuthLogService.Key in dataContainer
			? dataContainer[AuthLogService.Key] as AuthLogService.Bag
			: undefined

		await db.commandBus.execute(new CreateAuthLogEntryCommand({
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
			metadata: {},
		}))
	}
}

namespace AuthLogService {
	export const Key = Symbol('AuthLogData')
	type Data = {
		personId?: string
		personInput?: string // e.g. email
		tokenId?: string
		identityProviderId?: string
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
