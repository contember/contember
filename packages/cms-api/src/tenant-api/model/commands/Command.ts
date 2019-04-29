import Client from '../../../core/database/Client'

interface Command<Result> {
	execute(db: Client): Promise<Result>
}

export default Command
