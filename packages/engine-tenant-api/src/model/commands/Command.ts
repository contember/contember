import { Client } from '@contember/database'

export interface Command<Result> {
	execute(db: Client): Promise<Result>
}
