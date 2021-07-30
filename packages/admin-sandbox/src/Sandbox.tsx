import { Layout, Pages } from '@contember/admin'
import * as pages from './pages'

export default () => <Pages layout={Layout} children={Object.values(pages)} />
