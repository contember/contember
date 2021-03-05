import { storiesOf } from '@storybook/react'
import { ContentStatus } from '../../src'

storiesOf('ContentStatus', module).add('simple', () => <ContentStatus label="Concept, unsaved" />)
