import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { FormGroup, InputGroup } from '../../src/components/ui'

storiesOf('Form group', module).add('text field', () => (
	<>
		<FormGroup label="Label">
			<InputGroup placeholder="Placeholder" value="Value" />
		</FormGroup>
		<FormGroup label="Label">
			<InputGroup placeholder="Placeholder" />
		</FormGroup>
		<FormGroup label="Label">
			<InputGroup type="password" placeholder="Placeholder" value="Value" />
		</FormGroup>
		<FormGroup label="Label">
			<InputGroup type="password" placeholder="Placeholder" />
		</FormGroup>
	</>
))
