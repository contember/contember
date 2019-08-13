import { configure } from '@storybook/react'
import '@storybook/addon-knobs/register'

function loadStories() {
	require('../index')
}

configure(loadStories, module)
