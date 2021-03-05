import { storiesOf } from '@storybook/react'
import { ContemberLogo, SeamlessDropdown, UserMiniControl } from '../../src'

storiesOf('SeamlessDropdown', module)
	.add('default', () => (
		<SeamlessDropdown label="Open dropdown" caret>
			content
		</SeamlessDropdown>
	))
	.add('hoverable', () => (
		<SeamlessDropdown label="Open dropdown" hoverable>
			content
		</SeamlessDropdown>
	))
	.add('custom label', () => (
		<SeamlessDropdown
			label={
				<>
					<ContemberLogo /> Open dropdown
				</>
			}
		>
			content
		</SeamlessDropdown>
	))
	.add('in content', () => (
		<div>
			<p>Lorem ipsum</p>
			<SeamlessDropdown label="Open dropdown">content</SeamlessDropdown>
			<p>Dolor sit amet</p>
		</div>
	))
	.add('inline in content', () => (
		<div>
			<p>
				Lorem ipsum{' '}
				<SeamlessDropdown label="Open dropdown" inline>
					content
				</SeamlessDropdown>{' '}
				dolor sit amet
			</p>
		</div>
	))
	.add('user', () => (
		<SeamlessDropdown
			caret
			label={
				<UserMiniControl avatarUrl="https://i.pravatar.cc/150?img=3" name="Honza Sládek" note="Superadministrator" />
			}
		>
			content
		</SeamlessDropdown>
	))
