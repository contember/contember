import { storiesOf } from '@storybook/react'
import { ContemberLogo } from '../../src'

storiesOf('ContemberLogo', module)
	.add('default', () => <ContemberLogo />)
	.add('large', () => <ContemberLogo size="large" />)
	.add('logotype', () => <ContemberLogo logotype />)
	.add('large logotype', () => <ContemberLogo size="large" logotype />)
	.add('in text', () => (
		<p>
			Hello world, this is <ContemberLogo /> Contember. And this should be baseline aligned.
		</p>
	))
	.add('logotype in text', () => (
		<p>
			Hello world, this is <ContemberLogo logotype />. And this should be baseline aligned.
		</p>
	))
