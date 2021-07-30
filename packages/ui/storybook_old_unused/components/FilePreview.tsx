import { boolean, number } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import type { ReactNode } from 'react'
import { FilePreview, UploadProgress } from '../../src'

const dummyImg = <img src="http://placekitten.com/200/300" />
const Wrap = (props: { children: ReactNode }) => (
	<div style={{ width: '167px', margin: '50px auto' }}>{props.children}</div>
)

storiesOf('FilePreview', module)
	.add('complete', () => (
		<Wrap>
			<FilePreview isActive={boolean('Active', false)}>{dummyImg}</FilePreview>
		</Wrap>
	))
	.add('progressing', () => {
		const progress = number('Progress', 0.5, {
			range: true,
			min: 0,
			max: 1,
			step: 0.05,
		})

		return (
			<Wrap>
				<FilePreview overlay={<UploadProgress progress={progress} />} isActive={boolean('Active', false)}>
					{dummyImg}
				</FilePreview>
			</Wrap>
		)
	})
