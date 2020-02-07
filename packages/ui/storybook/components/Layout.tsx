import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Layout } from '../../src/components'

storiesOf('Layout', module).add('simple', () => {
	return <Layout />
})
