import { ProjectConfig } from '../../types'
import { MigrationsResolver } from '@contember/schema-migrations'

export type MigrationsResolverFactory = (project: ProjectConfig) => MigrationsResolver
