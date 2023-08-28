import { ActionableBox, Card, Grid } from '@contember/ui'
import { useCallback } from 'react'
import { SlotSources } from '../components/Slots'

export default () => (
	<>
		<SlotSources.Title>Actionable Boxes</SlotSources.Title>

		<Grid columnWidth={160}>
			<ActionableBox
				onRemove={useCallback(() => {
					alert('Are you sure you want to remove this?')
				}, [])}
			>
				<Card />
			</ActionableBox>
		</Grid>
	</>
)
