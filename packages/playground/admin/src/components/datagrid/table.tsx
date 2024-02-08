import { Component } from '@contember/interface'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { DataViewColumnHeader } from './column-header'
import * as React from 'react'
import { ReactNode } from 'react'
import { DataViewEachRow, DataViewHasSelection } from '@contember/react-dataview'

export type DataViewTableColumn = {
	header: ReactNode
	cell: ReactNode
	hidingName?: string
	sortingField?: string
}

export interface DataViewTableProps {
	firstColumnActions?: ReactNode
	lastColumnActions?: ReactNode
	columns: DataViewTableColumn[]
}

export const DataViewTable = Component(({ columns, firstColumnActions, lastColumnActions }: DataViewTableProps) => {
	return (
		<div className={'rounded-md border overflow-x-auto'}>
			<Table>
				<TableHeader>
					<TableRow>
						{firstColumnActions && <TableHead align={'left'}>
							<span className={'sr-only'}>Actions</span>
						</TableHead>}

						{Object.entries(columns).map(([key, { header, hidingName, sortingField }]) => (
							<DataViewHasSelection name={hidingName ?? key} key={key}>
								<TableHead className={'text-center'}>
									<DataViewColumnHeader hidingName={hidingName ?? key} sortingField={sortingField}>
										{header}
									</DataViewColumnHeader>
								</TableHead>
							</DataViewHasSelection>
						))}

						{lastColumnActions && <TableHead align={'right'}>
							<span className={'sr-only'}>Actions</span>
						</TableHead>}
					</TableRow>
				</TableHeader>
				<TableBody>
					<DataViewEachRow>
						<TableRow>
							{firstColumnActions && <TableCell align={'left'}>
								{firstColumnActions}
							</TableCell>}
							{Object.entries(columns).map(([key, { cell, hidingName }]) => (
								<DataViewHasSelection name={hidingName ?? key} key={key}>
									<TableCell>
										{cell}
									</TableCell>
								</DataViewHasSelection>
							))}
							{lastColumnActions && <TableCell align={'left'}>
								{lastColumnActions}
							</TableCell>}
						</TableRow>
					</DataViewEachRow>
				</TableBody>
			</Table>
		</div>
	)
})
