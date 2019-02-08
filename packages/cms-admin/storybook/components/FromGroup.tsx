import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { FormGroup } from '../../src/components/ui/FormGroup'
import { InputGroup } from '../../src/components/ui/InputGroup'

storiesOf('Form group', module).add('text field', () => (
	<>
		<FormGroup label="Label">
			<InputGroup inputProps={{ placeholder: 'Placeholder', value: 'Value' }} />
		</FormGroup>
		<FormGroup label="Label">
			<InputGroup inputProps={{ placeholder: 'Placeholder' }} />
		</FormGroup>
		<FormGroup label="Label">
			<InputGroup inputProps={{ type: 'password', placeholder: 'Placeholder', value: 'Value' }} />
		</FormGroup>
		<FormGroup label="Label">
			<InputGroup inputProps={{ type: 'password', placeholder: 'Placeholder' }} />
		</FormGroup>
		{/* <div className="formGroup">
			<label className="formGroup-label">Textarea</label>
			<textarea className="formGroup-field">
				Ryan Reynolds Just Fired Back At Kanye West After He Said 'Deadpool 2' Ripped Off His Music.
			</textarea>
		</div>
		<div className="formGroup">
			<label className="formGroup-label">Textarea</label>
			<textarea className="formGroup-field" placeholder="Placeholder" />
		</div> */}
	</>
))
