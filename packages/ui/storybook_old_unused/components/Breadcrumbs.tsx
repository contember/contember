import { storiesOf } from '@storybook/react'
import { Breadcrumbs } from '../../src'

storiesOf('Breadcrumbs', module).add('simple', () => (
	<Breadcrumbs items={[<a key={0} href="#">Content</a>, <a key={1} href="#">Posts</a>, 'Edit post']} />
))
