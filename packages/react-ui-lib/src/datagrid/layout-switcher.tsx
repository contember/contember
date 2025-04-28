import { DataViewLayoutTrigger, useDataViewSelectionState } from '@contember/react-dataview'
import { Button } from '../ui/button'
import { dict } from '../dict'
import { uic } from '../utils'

const LayoutSwitchButton = uic(Button, {
	baseClass: 'data-[active]:text-blue-600 data-[active]:bg-gray-50 data-[active]:shadow-inner gap-2 flex-1',
	defaultProps: {
		variant: 'outline',
		size: 'sm',
	},
})

/**
 * `DataGridLayoutSwitcher` is a UI component for switching between different data grid layouts.
 * It renders a set of buttons, allowing users to select and apply a layout dynamically.
 *
 * #### Example: Basic Usage
 * ```tsx
 * <DataGridLayoutSwitcher />
 * ```
 */
export const DataGridLayoutSwitcher = () => {
	const layouts = useDataViewSelectionState().layouts

	return (
		<div>
			<p className="text-gray-400 text-xs font-semibold mb-1">{dict.datagrid.layout}</p>
			<div className={'flex gap-1'}>
				{layouts.map(it => (
					<DataViewLayoutTrigger name={it.name} key={it.name}>
						<LayoutSwitchButton>
							{it.label}
						</LayoutSwitchButton>
					</DataViewLayoutTrigger>
				))}
			</div>
		</div>
	)
}
