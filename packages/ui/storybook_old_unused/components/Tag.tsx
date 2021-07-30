import { number } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { Tag } from '../../src/components'

storiesOf('Tag', module).add('simple', () => {
	const fontSize = number('Font size', 16, {
		range: true,
		min: 16,
		max: 160,
		step: 1,
	})

	return (
		<div
			style={{
				fontSize: `${fontSize / 16}rem`,
			}}
		>
			<Tag>Administrator</Tag>
			<Tag>Regional manager for 🇷🇴</Tag>
			<Tag onRemove={() => alert('Removed')}>Removable tag</Tag>
		</div>
	)
})
