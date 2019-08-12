import { Client } from '@contember/database'

interface Command<Result> {
	execute(db: Client): Promise<Result>
}

export default Command
