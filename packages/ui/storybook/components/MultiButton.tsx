import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Button, MultiButton } from '../../src'

storiesOf('MultiButton', module).add('simple', () => (
	<MultiButton>
		<Button intent="default" onClick={() => alert('Did default action')}>
			Default action
		</Button>
		<Button intent="primary" onClick={() => alert('Did important action')}>
			Important action
		</Button>
		<Button intent="success" onClick={() => alert('Did successful action')}>
			Successful action
		</Button>
		<Button intent="danger" onClick={() => alert('Did dangerous action')}>
			Dangerous action
		</Button>
	</MultiButton>
))
