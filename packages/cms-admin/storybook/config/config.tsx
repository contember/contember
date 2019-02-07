import { configure } from '@storybook/react'
import * as React from 'react'
// import { storiesOf } from '@storybook/react'
// // import * as s from '../dist/storybook/index'
// // console.log(require('../dist/storybook/index'))

function loadStories() {
// 	// stories()
// 	// storiesOf('Button', module)
// 	// 	.add('with text', () => <>Hello</>)
// 	// 	.add('with some emoji', () => (
// 	// 		<span role="img" aria-label="so cool">
// 	// 			😀 😎 👍 :/
// 	// 		</span>
// 	// 	))

	require('../index')
// 	// You can require as many stories as you need.
}

configure(loadStories, module)
