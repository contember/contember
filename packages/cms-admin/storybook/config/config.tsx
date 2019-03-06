import { configure } from '@storybook/react'

function loadStories() {
	require('../index')
}

configure(loadStories, module)
