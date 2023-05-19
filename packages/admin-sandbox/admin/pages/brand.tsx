import { ContemberIdentitySvgProps, Identity2023 } from '@contember/brand'
import { Stack } from '@contember/ui'
import { FunctionComponent } from 'react'
import { Title } from '../components/Directives'
import { Slots } from '../components/Slots'
import { ThemeSwitcher } from '../components/ThemeSwitcher'

const list = Identity2023 as Record<string, FunctionComponent<ContemberIdentitySvgProps>>

export default (
	<>
		<Title>Brand</Title>
		<Slots.Actions>
			<ThemeSwitcher />
		</Slots.Actions>
		<Slots.Content>
			<Stack direction="vertical" gap="small" style={{ fontSize: '3em' }}>
				{Object.keys(list).map(key => {
					const Component = list[key]
					return (
						<Stack align="center" direction="horizontal" gap="small" key={key}>
							<Component />
							{key}
						</Stack>
					)
				})}
			</Stack>
		</Slots.Content>
	</>
)
