import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { FormGroup } from '../../src/components/ui/FormGroup'
import { InputGroup } from '../../src/components/ui/InputGroup'

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
