import { boolean, radios } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Table2, Table2Cell, Table2Props, Table2Row } from '../../src/components'

const radiosJustification = (label: string): Table2Props['justification'] =>
	radios(label, {
		Left: 'justifyStart',
		Center: 'justifyCenter',
		Right: 'justifyEnd',
	})

storiesOf('Table', module).add('simple', () => {
	const useTableElement = boolean('Use table element', true)
	const useExampleHeading = boolean('Use example heading', true)
	const compact = boolean('Compact', false)
	const justification: Table2Props['justification'] = radiosJustification('Table justification')
	const justificationFirstColumn: Table2Props['justification'] = radiosJustification('First column justification')
	const justificationLastRow: Table2Props['justification'] = radiosJustification('Last row justification')
	const shrinkLastColumn = boolean('Shrink last column', true)

	const heading = useExampleHeading ? <span>Simple table</span> : undefined

	return (
		<Table2 useTableElement={useTableElement} heading={heading} compact={compact} justification={justification}>
			{[1, 2, 3, 4, 5, 6].map(row => (
				<Table2Row justification={row === 6 ? justificationLastRow : undefined}>
					{['A', 'B', 'C', 'D'].map(column => (
						<Table2Cell
							shrink={column === 'D' && shrinkLastColumn}
							justification={column === 'A' ? justificationFirstColumn : undefined}
						>
							Cell {row}
							{column}
						</Table2Cell>
					))}
				</Table2Row>
			))}
		</Table2>
	)
})
