import { storiesOf } from '@storybook/react'
import { PersistControl } from '../../src'

const noop = () => {}

storiesOf('PersistControl', module)
	.add('simple', () => <PersistControl isDirty={false} isMutating={false} onSave={noop} />)
	.add('dirty', () => <PersistControl isDirty={true} isMutating={false} onSave={noop} />)
	.add('mutating', () => <PersistControl isDirty={false} isMutating={true} onSave={noop} />)
	.add('mutating and dirty', () => <PersistControl isDirty={true} isMutating={true} onSave={noop} />)
