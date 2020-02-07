import { storiesOf } from '@storybook/react'
import * as React from 'react'
import { Breadcrumbs } from '../../src'

storiesOf('Breadcrumbs', module).add('simple', () => (
	<Breadcrumbs items={[<a href="#">Content</a>, <a href="#">Posts</a>, 'Edit post']} />
))
