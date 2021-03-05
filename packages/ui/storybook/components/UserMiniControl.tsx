import { storiesOf } from '@storybook/react'
import { UserMiniControl } from '../../src'

storiesOf('UserMiniControl', module)
	.add('simple', () => <UserMiniControl name="Honza Sládek" note="Superadministrator" />)
	.add('withAvatar', () => (
		<UserMiniControl avatarUrl="https://i.pravatar.cc/150?img=3" name="Honza Sládek" note="Superadministrator" />
	))
