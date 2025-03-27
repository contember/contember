import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { dict } from '../dict'
import * as React from 'react'
import { DataViewElementData, DataViewVisibilityTrigger, useDataViewElements } from '@contember/react-dataview'
import { ScrollArea } from '../ui/scroll-area'
import { Fragment } from 'react'

/**
 * Props for {@link DataGridToolbarVisibleElements}.
 */
export interface DataGridToolbarVisibleElementsProps {
	elements?: DataViewElementData[]
}

/**
 * Control for toggling visibility of columns in data grid.
 */
export const DataGridToolbarVisibleElements = ({ elements }: DataGridToolbarVisibleElementsProps) => {
	const globalElements = useDataViewElements()

	const resolvedElements = elements ?? globalElements
	if (resolvedElements.length === 0) {
		return null
	}
	return (
		<div>
			<p className="text-gray-400 text-xs font-semibold mb-1">{dict.datagrid.visibleFields}</p>
			<div className="flex flex-col bg-gray-50 p-2 border border-gray-200 rounded-sm shadow-inner">
				<ScrollArea className={'max-h-48'}>
					<div className="flex flex-col">
						<DataGridToolbarVisibleElementsList elements={resolvedElements} />
					</div>
				</ScrollArea>
			</div>
		</div>
	)
}


const DataGridToolbarVisibleElementsList = ({ elements }: { elements: DataViewElementData[] }) => {
	return elements.map(element => {
		if (!element.name) {
			return null
		}
		return (
			<Fragment key={element.name}>
				<DataViewVisibilityTrigger key={element.name} name={element.name} value={it => !(it ?? true)}>
					<button className={'gap-2 group text-gray-400 data-[current]:text-black text-left inline-flex items-center p-0.5 text-sm rounded-sm hover:bg-background'}>
						<EyeIcon className={'w-3 h-3 hidden group-data-[current]:block'} />
						<EyeOffIcon className={'w-3 h-3 block group-data-[current]:hidden'} />
						<span>{element.label}</span>
					</button>
				</DataViewVisibilityTrigger>
				{element.children && <div className="flex flex-col ml-4"><DataGridToolbarVisibleElementsList elements={element.children} /></div>}
			</Fragment>
		)
	})

}
