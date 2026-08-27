import { createContext, createRequiredContext } from '@contember/react-utils'
import { WriteRefTracker } from '@contember/graphql-client'
import { GraphQlClientFactory, SessionTokenContextValue } from './types/index.js'

const SessionTokenContext_ = createContext<SessionTokenContextValue>('SessionTokenContext', {
	propsToken: undefined,
	source: undefined,
	token: undefined,
})

export const SessionTokenContext = SessionTokenContext_[0]
export const useSessionTokenWithMeta = SessionTokenContext_[1]
export const useSessionToken = () => useSessionTokenWithMeta().token

const SetSessionTokenContext_ = createRequiredContext<(token: string | undefined) => void>('SetSessionTokenContext')

export const SetSessionTokenContext = SetSessionTokenContext_[0]
export const useSetSessionToken = SetSessionTokenContext_[1]

const ApiBaseUrlContext_ = createRequiredContext<string>('ApiBaseUrlContext')

export const ApiBaseUrlContext = ApiBaseUrlContext_[0]
export const useApiBaseUrl = ApiBaseUrlContext_[1]

const LoginTokenContext_ = createContext<string | undefined>('LoginTokenContext', undefined)

export const LoginTokenContext = LoginTokenContext_[0]
export const useLoginToken = LoginTokenContext_[1]

const ProjectSlugContext_ = createContext<string | undefined>('ProjectSlugContext', undefined)

export const ProjectSlugContext = ProjectSlugContext_[0]
export const useProjectSlug = ProjectSlugContext_[1]

const StageSlugContext_ = createContext<string | undefined>('StageSlugContext', undefined)

export const StageSlugContext = StageSlugContext_[0]
export const useStageSlug = StageSlugContext_[1]

const GraphQlClientFactoryContext_ = createContext<GraphQlClientFactory | undefined>('GraphQlClientFactoryContext', undefined)

export const GraphQlClientFactoryContext = GraphQlClientFactoryContext_[0]
export const useGraphQlClientFactory = GraphQlClientFactoryContext_[1]

/** Write references of the current identity, one tracker per API path. `undefined` when read-after-write is off. */
const ReadAfterWriteTrackersContext_ = createContext<Map<string, WriteRefTracker> | undefined>('ReadAfterWriteTrackersContext', undefined)

export const ReadAfterWriteTrackersContext = ReadAfterWriteTrackersContext_[0]
export const useReadAfterWriteTrackers = ReadAfterWriteTrackersContext_[1]
