import { Command } from "../Command.js"
import { InsertBuilder } from '@contember/database'
import { plusMinutes } from "../../utils/time.js"
import { computeTokenHash, generateToken, TokenHash } from "../../utils/index.js"

/**
 * Creates an `mfa_email_otp` person_token carrying a 6-digit code in `otp_hash`.
 *
 * Unlike the passwordless flow there is no magic-link step, so the code itself is
 * the only secret — it is validated via {@link validateToken}'s `'otp'` path. The
 * `token_hash` column is NOT NULL and UNIQUE, so we still fill it with a random,
 * never-used token hash to satisfy the schema.
 */
export class SaveEmailOtpTokenCommand implements Command<SaveEmailOtpTokenCommand.Result> {
	constructor(
		private readonly personId: string,
		private readonly code: string,
		private readonly expirationMinutes: number,
	) {}

	async execute({ db, providers }: Command.Args): Promise<SaveEmailOtpTokenCommand.Result> {
		const id = providers.uuid()
		const expiresAt = plusMinutes(providers.now(), this.expirationMinutes)
		const tokenHash: TokenHash = computeTokenHash(await generateToken(providers))
		const otpHash = computeTokenHash(this.code)
		await InsertBuilder.create()
			.into('person_token')
			.values({
				id: id,
				token_hash: tokenHash,
				person_id: this.personId,
				expires_at: expiresAt,
				created_at: providers.now(),
				used_at: null,
				type: 'mfa_email_otp',
				otp_hash: otpHash,
			})
			.execute(db)

		return { id, expiresAt }
	}
}

namespace SaveEmailOtpTokenCommand {
	export interface Result {
		id: string
		expiresAt: Date
	}
}
