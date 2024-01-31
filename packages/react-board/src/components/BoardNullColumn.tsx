import { BoardCurrentColumnContext, useBoardColumns } from '../contexts'
import { ReactNode } from 'react'
import { BoardNullColumnPlaceholder } from '../const'

export type BoardNullColumnProps = {
	children: ReactNode
	hideEmpty?: boolean
};
export const BoardNullColumn = ({ children, hideEmpty }: BoardNullColumnProps) => {
	const column = useBoardColumns().find(it => it.id === BoardNullColumnPlaceholder)
	if (!column || (hideEmpty && column.items.length === 0)) {
		return null
	}

	return (
		<BoardCurrentColumnContext.Provider value={column}>
			{children}
		</BoardCurrentColumnContext.Provider>
	)
}
