import Command from './Command'
import * as crypto from 'crypto'
import ApiKey from '../type/ApiKey'
import { uuid } from '../../../utils/uuid'
import { now } from '../../../utils/date'
import KnexWrapper from '../../../core/knex/KnexWrapper'

class CreateApiKey implements Command<CreateApiKey.Result> {
	constructor(private readonly type: ApiKey.Type, private readonly identityId: string) {}

	async execute(db: KnexWrapper): Promise<CreateApiKey.Result> {
		const apiKeyId = uuid()
		const token = await this.generateToken()
		const tokenHash = ApiKey.computeTokenHash(token)

		await db
			.insertBuilder()
			.into('api_key')
			.values({
				id: apiKeyId,
				token_hash: tokenHash,
				type: this.type,
				identity_id: this.identityId,
				enabled: true,
				expires_at: this.getExpiration(),
				created_at: now(),
			})
			.execute()

		return new CreateApiKey.Result(apiKeyId, token)
	}

	private generateToken(): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			crypto.randomBytes(20, (error, buffer) => {
				if (error) {
					reject(error)
				} else {
					resolve(buffer.toString('hex'))
				}
			})
		})
	}

	private getExpiration(): Date | null {
		switch (this.type) {
			case ApiKey.Type.PERMANENT:
				return null

			case ApiKey.Type.SESSION:
				return new Date(now().getTime() + 30 * 60 * 1000)
			case ApiKey.Type.ONE_OFF:
				return null
		}
	}
}

namespace CreateApiKey {
	export class Result {
		constructor(public readonly id: string, public readonly token: string) {}
	}
}

export default CreateApiKey
