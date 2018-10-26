import KnexWrapper from '../../../core/knex/KnexWrapper'

interface Command<Result> {
	execute(db: KnexWrapper): Promise<Result>
}

export default Command
