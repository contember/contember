import { Component } from '@contember/interface'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { DataGridColumnHeader } from './column-header'
import * as React from 'react'
import { ReactNode } from 'react'
import { DataViewEachRow, DataViewIsVisible } from '@contember/react-dataview'

export type DataGridTableColumn = {
	header: ReactNode
	cell: ReactNode
	hidingName?: string
	sortingField?: string
}

export interface DataViewTableProps {
	firstColumnActions?: ReactNode
	lastColumnActions?: ReactNode
	columns: DataGridTableColumn[]
}

export const DataGridTable = Component(({ columns, firstColumnActions, lastColumnActions }: DataViewTableProps) => {
	return (
		<div className={'rounded-md border overflow-x-auto'}>
			<Table>
				<TableHeader>
					<TableRow>
						{firstColumnActions && <TableHead align={'left'}>
						</TableHead>}

						{Object.entries(columns).map(([key, { header, hidingName, sortingField }]) => (
							<DataViewIsVisible name={hidingName ?? key} key={key}>
								<TableHead className={'text-center'}>
									<DataGridColumnHeader hidingName={hidingName ?? key} sortingField={sortingField}>
										{header}
									</DataGridColumnHeader>
								</TableHead>
							</DataViewIsVisible>
						))}

						{lastColumnActions && <TableHead align={'right'}>
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
								<DataViewIsVisible name={hidingName ?? key} key={key}>
									<TableCell>
										{cell}
									</TableCell>
								</DataViewIsVisible>
							))}
							{lastColumnActions && <TableCell align={'right'}>
								{lastColumnActions}
							</TableCell>}
						</TableRow>
					</DataViewEachRow>
				</TableBody>
			</Table>
		</div>
	)
})
