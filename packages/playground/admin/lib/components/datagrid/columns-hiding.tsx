import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown'
import { Button } from '../ui/button'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { dict } from '../../dict'
import * as React from 'react'
import { DataGridColumn } from './grid'
import { DataViewSelectionTrigger } from '@contember/react-dataview'
import { ScrollArea } from '../ui/scroll-area'

export const DataGridToolbarColumns = ({ columns }: { columns: DataGridColumn[] }) => {
	return <div>
		<p className="text-gray-400 text-xs font-semibold mb-1">{dict.datagrid.columns}</p>
		<div className="flex flex-col bg-gray-50 p-2 border rounded shadow-inner">
			<ScrollArea className={'max-h-48'}>
				<div className="flex flex-col">
					{columns.map(column => (
						column.hidingName && <DataViewSelectionTrigger key={column.hidingName} name={column.hidingName} value={it => !(it ?? true)}>
							<button  className={'gap-2 group text-gray-400 data-[current]:text-black text-left inline-flex items-center p-0.5 text-sm rounded hover:bg-white'}>
								<EyeIcon className={'w-3 h-3 hidden group-data-[current]:block'} />
								<EyeOffIcon className={'w-3 h-3 block group-data-[current]:hidden'} />
								<span>{column.header}</span>
							</button>
						</DataViewSelectionTrigger>
					))}
				</div>
			</ScrollArea>
		</div>
	</div>
	return <DropdownMenu>
		<DropdownMenuTrigger asChild>
			<Button variant={'outline'} size={'sm'} className={'gap-2'}>
				<EyeIcon className={'w-4 h-4'} />
				<span className={'sr-only'}>{dict.datagrid.columns}</span>
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent className="w-[160px]">

		</DropdownMenuContent>
	</DropdownMenu>
}
