import type { GraphQlClient } from '@contember/client'
import { useGraphQlClient } from '../useGraphQlClient'

export const useContentGraphQlClient = (projectSlug: string, stageSlug: string): GraphQlClient => useGraphQlClient(`/content/${projectSlug}/${stageSlug}`)
