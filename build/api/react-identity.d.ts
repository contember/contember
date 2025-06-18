import { Environment } from '@contember/react-binding';
import { Identity } from '@contember/react-client-tenant';
import { NamedExoticComponent } from 'react';
import { ReactNode } from 'react';

/**
 * @group Logic Components
 */
export declare const HasRole: NamedExoticComponent<HasRoleProps>;

export declare interface HasRoleProps {
    children?: ReactNode;
    role: RoleCondition;
}

export declare const identityEnvironmentExtension: Environment.Extension<Identity | null, {
    identity: Identity | undefined;
}>;

export declare const IdentityEnvironmentProvider: React.FC<IdentityEnvironmentProviderProps>;

export declare interface IdentityEnvironmentProviderProps {
    children: ReactNode;
}

export declare const projectEnvironmentExtension: Environment.Extension<string | null, {
    slug: string | undefined;
}>;

export declare type ProjectUserRoles = Set<string>;

export declare type RoleCondition = string | ((roles: Set<string>) => boolean);

export declare const useProjectUserRoles: () => ProjectUserRoles;


export * from "@contember/react-client-tenant";

export { }
