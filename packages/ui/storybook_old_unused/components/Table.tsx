import { boolean, radios } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { Table, TableCell, TableProps, TableRow } from '../../src/components'
import { sizeKnob } from '../utils/knobs'

const radiosJustification = (label: string): TableProps['justification'] =>
	radios(
		label,
		{
			Left: 'justifyStart',
			Center: 'justifyCenter',
			Right: 'justifyEnd',
		},
		'justifyStart',
	)

storiesOf('Table', module).add('simple', () => {
	//const useTableElement = boolean('Use table element', true)
	const useExampleHeading = boolean('Use example heading', true)
	const size = sizeKnob()
	const justification: TableProps['justification'] = radiosJustification('Table justification')
	const justificationFirstColumn: TableProps['justification'] = radiosJustification('First column justification')
	const justificationLastRow: TableProps['justification'] = radiosJustification('Last row justification')
	const shrinkLastColumn = boolean('Shrink last column', true)

	const heading = useExampleHeading ? <span>Simple table</span> : undefined

	return (
		<Table /*useTableElement={useTableElement}*/ heading={heading} size={size} justification={justification}>
			{[1, 2, 3, 4, 5, 6].map(row => (
				<TableRow justification={row === 6 ? justificationLastRow : undefined}>
					{['A', 'B', 'C', 'D'].map(column => (
						<TableCell
							shrunk={column === 'D' && shrinkLastColumn}
							justification={column === 'A' ? justificationFirstColumn : undefined}
						>
							Cell {row}
							{column}
						</TableCell>
					))}
				</TableRow>
			))}
		</Table>
	)
})
