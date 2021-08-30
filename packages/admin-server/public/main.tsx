import { LoginEntrypoint, Project, runReactApp } from '@contember/admin'
import './index.sass'

const el = document.getElementById('contember-config')
const config = JSON.parse(el?.innerHTML ?? '{}')
const formatProjectUrl = (project: Project) => `/${project.slug}/`

runReactApp(<LoginEntrypoint {...config} formatProjectUrl={formatProjectUrl} />, '#root')
