import { boolean } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { FileDropZone } from '../../src'

storiesOf('FileDropZone', module).add('simple', () => (
	<FileDropZone
		isActive={boolean('Active', false)}
		isAccepting={boolean('Accepting', false)}
		isRejecting={boolean('Rejecting', false)}
	>
		<div style={{ width: '300px', height: '200px' }}>CONTENT</div>
	</FileDropZone>
))
