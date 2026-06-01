import type { GraphQlClient } from '@contember/graphql-client'
import { useGraphQlClient } from './useGraphQlClient.js'

export const useContentGraphQlClient = (projectSlug: string, stageSlug: string): GraphQlClient =>
	useGraphQlClient(`/content/${projectSlug}/${stageSlug}`)
