// Commands of `tenant person`, plus `tenant session create` and `tenant identity role …` — the directory
// maps to the TenantPersonClient domain (persons, sessions, global identity roles), not to a command prefix.
// `personInput.ts` stays unexported on purpose: the five tenant barrels merge into `commands/tenant/index.ts`.
export * from './TenantIdentityRoleAddCommand.js'
export * from './TenantIdentityRoleRemoveCommand.js'
export * from './TenantPersonCreateCommand.js'
export * from './TenantPersonDisableCommand.js'
export * from './TenantPersonListCommand.js'
export * from './TenantPersonResetMfaCommand.js'
export * from './TenantPersonResetPasswordRequestCommand.js'
export * from './TenantPersonSetPasswordCommand.js'
export * from './TenantPersonShowCommand.js'
export * from './TenantPersonSignOutCommand.js'
export * from './TenantPersonUpdateCommand.js'
export * from './TenantSessionCreateCommand.js'
