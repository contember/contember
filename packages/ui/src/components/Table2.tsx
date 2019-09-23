import * as React from 'react'

const UseTableElementContext = React.createContext(true)

export interface Table2Props {
	children?: React.ReactNode
	useTableElement?: boolean
}
export const Table2 = React.memo(({ children, useTableElement = true }: Table2Props) => {
	return (
		<UseTableElementContext.Provider value={useTableElement}>
			{useTableElement ? (
				<table className="table2">
					<tbody>{children}</tbody>
				</table>
			) : (
				<div className="table2">{children}</div>
			)}
		</UseTableElementContext.Provider>
	)
})
Table2.displayName = 'Table2'

export interface Table2RowProps {
	children?: React.ReactNode
}
export const Table2Row = React.memo((props: Table2RowProps) => {
	const useTableElement = React.useContext(UseTableElementContext)

	if (useTableElement) {
		return <tr className="table2-row">{props.children}</tr>
	}
	return <div className="table2-row">{props.children}</div>
})
Table2Row.displayName = 'Table2Row'

export interface Table2CellProps {
	children?: React.ReactNode
}
export const Table2Cell = React.memo((props: Table2CellProps) => {
	const useTableElement = React.useContext(UseTableElementContext)

	if (useTableElement) {
		return <td className="table2-cell">{props.children}</td>
	}
	return <div className="table2-cell">{props.children}</div>
})
Table2Cell.displayName = 'Table2Cell'
