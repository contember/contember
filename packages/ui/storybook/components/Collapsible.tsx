import { boolean } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Collapsible } from '../../src'

storiesOf('Collapsible', module).add('simple', () => {
	const expanded = boolean('Expanded', true)

	return (
		<Collapsible expanded={expanded}>
			<p>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vel tincidunt lacus. Duis vestibulum, justo
				vitae blandit tristique, dui tellus luctus nisi, vitae venenatis nunc ligula ac leo. Aenean non turpis a velit
				ullamcorper ullamcorper. Nunc rutrum et elit vitae convallis. Integer euismod, eros eget consequat egestas,
				neque libero vulputate ipsum, quis molestie dolor felis quis libero. Etiam imperdiet, magna vel dapibus gravida,
				magna tortor scelerisque dui, eu pellentesque urna sem a quam. Ut sapien enim, bibendum vitae congue a, accumsan
				vel mi. Aenean eu congue lectus. Nulla nisl erat, consequat quis erat ac, eleifend auctor lorem. In commodo
				dolor erat, at malesuada lacus imperdiet non. Cras viverra dolor sit amet velit posuere rhoncus. Curabitur vitae
				finibus justo, et euismod metus. Vestibulum auctor lectus vel lorem vehicula imperdiet.
			</p>

			<p>
				Nam sed bibendum risus. Phasellus quis dui quis tortor pretium tempor ullamcorper in felis. Nunc quam dui,
				tempor vel lacinia ut, pellentesque eget eros. Proin gravida auctor turpis sed pulvinar. Proin lacinia imperdiet
				purus eu lobortis. Pellentesque sodales elit et viverra lobortis. Cras quis efficitur nibh. Nulla auctor erat
				neque. Ut vitae metus ac elit malesuada consequat.
			</p>
		</Collapsible>
	)
})
