import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { Button, ButtonColor, ButtonProps } from '../../src/components/ui'

const variedColors = (props: Exclude<ButtonProps, 'color'>) => (
	<>
		<Button {...props}>Save</Button>
		<Button {...props} color={ButtonColor.Blue}>
			Save
		</Button>
		<Button {...props} color={ButtonColor.Green}>
			Save
		</Button>
		<Button {...props} color={ButtonColor.Red}>
			Save
		</Button>
	</>
)

storiesOf('Button', module)
	.add('colored', () => variedColors({}))
	.add('small', () => variedColors({ small: true }))
	.add('disabled', () => variedColors({ disabled: true }))
	.add('link', () => variedColors({ Component: 'a', href: 'https://example.com' }))
