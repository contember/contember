import { KoaMiddleware, ModuleInfoMiddlewareState, ProjectInfoMiddlewareState } from '@contember/engine-http'
import prom from 'prom-client'
import { GraphQLKoaState } from '@contember/engine-http'
export declare const createColllectHttpMetricsMiddleware: (registry: prom.Registry) => KoaMiddleware<Partial<ProjectInfoMiddlewareState & ModuleInfoMiddlewareState & GraphQLKoaState>>
//# sourceMappingURL=CollectHttpMetricsMiddelware.d.ts.map
