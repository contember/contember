import { boolean, radios } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { Collapsible, CollapsibleProps } from '../../src'

storiesOf('Collapsible', module).add('simple', () => {
	const expanded: CollapsibleProps['expanded'] = boolean('Expanded', true)
	const transition: CollapsibleProps['transition'] = radios(
		'Transition',
		{
			'Default': 'default',
			'Top insert': 'topInsert',
			'Bottom insert': 'bottomInsert',
			'Left insert': 'leftInsert',
			'Right insert': 'rightInsert',
			'Fade': 'fade',
		},
		'default',
	)

	return (
		<div style={{ overflow: 'hidden' }}>
			<p>Other content…</p>
			<Collapsible expanded={expanded} transition={transition}>
				<div style={{ border: '1px solid', padding: '0 1em' }}>
					<h4>Collapsible content</h4>
					<p>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vel tincidunt lacus. Duis vestibulum, justo
						vitae blandit tristique, dui tellus luctus nisi, vitae venenatis nunc ligula ac leo. Aenean non turpis a
						velit ullamcorper ullamcorper.
					</p>
					<p>
						Nam sed bibendum risus. Phasellus quis dui quis tortor pretium tempor ullamcorper in felis. Nunc quam dui,
						tempor vel lacinia ut, pellentesque eget eros. Proin gravida auctor turpis sed pulvinar. Proin lacinia
						imperdiet purus eu lobortis.
					</p>
				</div>
			</Collapsible>
			<p>Other content…</p>
		</div>
	)
})
