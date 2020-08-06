import { withKnobs } from '@storybook/addon-knobs'
import { addDecorator, addParameters, configure } from '@storybook/react'

function loadStories() {
	require('../dist/storybook/index')
}

addParameters({
	panelPosition: 'right',
})

addDecorator(withKnobs)

configure(loadStories, module)
