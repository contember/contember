import { storiesOf } from '@storybook/react'
import { Button, FormGroup, MultiButton } from '../../src'

storiesOf('MultiButton', module)
	.add('simple', () => (
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
	.add('with from groups', () => (
		<MultiButton>
			<FormGroup
				label="Generic action"
				description="This is not really important."
				labelDescription="It makes things happen."
			>
				<Button intent="default" onClick={() => alert('Did default action')}>
					Default action
				</Button>
			</FormGroup>
			<FormGroup
				label="Important action"
				description="This one is actually quite important."
				labelDescription="It makes important things happen."
			>
				<Button intent="primary" onClick={() => alert('Did important action')}>
					Important action
				</Button>
			</FormGroup>
			<FormGroup
				label="Successful action"
				description="This action will do good."
				labelDescription="It makes things succeed"
			>
				<Button intent="success" onClick={() => alert('Did successful action')}>
					Successful action
				</Button>
			</FormGroup>
			<FormGroup
				label="Dangerous action"
				description="This one can spell disaster."
				labelDescription="You better be reaaaly careful!"
			>
				<Button intent="danger" onClick={() => alert('Did dangerous action')}>
					Dangerous action
				</Button>
			</FormGroup>
		</MultiButton>
	))
