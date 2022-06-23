import { Command } from '../Command.js'
import { computeTokenHash, generateToken } from '../../utils/index.js'
import { SavePasswordResetRequestCommand } from './SavePasswordResetRequestCommand.js'

export class CreatePasswordResetRequestCommand implements Command<CreatePasswordResetRequestResult> {
	constructor(
		private readonly personId: string,
		private readonly expirationMinutes?: number,
	) {}

	async execute({ db, providers, bus }: Command.Args): Promise<CreatePasswordResetRequestResult> {
		const token = await generateToken(providers)
		const tokenHash = computeTokenHash(token)
		await bus.execute(new SavePasswordResetRequestCommand(
			this.personId,
			tokenHash,
			this.expirationMinutes,
		))

		return new CreatePasswordResetRequestResult(token)
	}
}
export class CreatePasswordResetRequestResult {
	constructor(public readonly token: string) {}
}
