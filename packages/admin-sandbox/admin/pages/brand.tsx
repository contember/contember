import { ContemberIdentitySvgProps, Identity2023 } from '@contember/brand'
import { Stack } from '@contember/ui'
import { FunctionComponent } from 'react'
import { SlotSources } from '../components/Slots'

const list = Identity2023 as Record<string, FunctionComponent<ContemberIdentitySvgProps>>

export default (
	<>
		<SlotSources.Title>Brand</SlotSources.Title>

		<Stack gap="gap" style={{ fontSize: '3em' }}>
			{Object.keys(list).map(key => {
				const Component = list[key]
				return (
					<Stack align="center" horizontal gap="gap" key={key}>
						<Component />
						{key}
					</Stack>
				)
			})}
		</Stack>
	</>
)
