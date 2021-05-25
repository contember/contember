import { number } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import type { CSSProperties } from 'react'
import { UploadProgress } from '../../src'

const borderStyle: CSSProperties = {
	height: '167px',
	width: '167px',
	border: '1px solid',
	margin: '2rem auto',
	fontSize: '16px',
	paddingTop: '50px',
}

storiesOf('UploadProgress', module)
	.add('indeterminate', () => (
		<div style={borderStyle}>
			<UploadProgress />
		</div>
	))
	.add('progressing', () => {
		const progress = number('Progress', 0.5, {
			range: true,
			min: 0,
			max: 1,
			step: 0.05,
		})

		return (
			<div style={borderStyle}>
				<UploadProgress progress={progress} />
			</div>
		)
	})
