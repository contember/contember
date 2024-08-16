import { BoardTaskStatus, GridArticleState } from '../../api/client'
import { createEnumFormatter } from '@app/lib/formatting'

export const BoardTaskStatusLabels: Record<BoardTaskStatus, string> = {
	backlog: 'Backlog',
	done: 'Done',
	todo: 'To Do',
	inProgress: 'In Progress',
}
export const formatBoardTaskStatus = createEnumFormatter(BoardTaskStatusLabels)

export const GridArticleStateLabels: Record<GridArticleState, string> = {
	published: 'Published',
	draft: 'Draft',
	archived: 'Archived',
}

export const formatGridArticleState = createEnumFormatter(GridArticleStateLabels)

