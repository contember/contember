import { JSX as JSX_2 } from 'react/jsx-runtime';
import { MembershipInput } from '@contember/graphql-client-tenant';
import { ProjectMembersFilter } from '@contember/graphql-client-tenant';
import { ProjectMembersQueryResult } from '@contember/react-client-tenant';
import { ReactNode } from 'react';

export declare const ApiKeyList: (props: {
    controller?: {
        current?: MemberListController;
    };
}) => JSX_2.Element;

export declare const ChangeMyPasswordFormFields: () => JSX_2.Element;

export declare const CreateApiKeyFormFields: ({ projectSlug }: {
    projectSlug: string;
}) => JSX_2.Element;

export declare const InviteFormFields: ({ projectSlug, roles }: {
    projectSlug: string;
    roles?: RolesConfig;
}) => JSX_2.Element;

export declare const LoginFormFields: () => JSX_2.Element;

export declare const MemberDeleteDialog: ({ onError, title, identityId, onSuccess, projectSlug }: MemberDeleteProps) => JSX_2.Element;

export declare interface MemberDeleteProps {
    title: ReactNode;
    identityId: string;
    projectSlug: string;
    onSuccess: () => void;
    onError: (e: unknown) => void;
}

export declare const MemberList: ({ filter, labels, tableColumns, controller, tableHeaders, roles }: MemberListProps) => JSX_2.Element;

export declare interface MemberListController {
    refresh: () => void;
}

export declare interface MemberListProps {
    filter: ProjectMembersFilter;
    labels: {
        deleteConfirmation: string;
        deleted: string;
        deleteFailed: string;
    };
    tableColumns: (it: ProjectMembersQueryResult[number]) => ReactNode;
    tableHeaders: string[];
    controller?: {
        current?: MemberListController;
    };
    roles?: RolesConfig;
}

export declare const MembershipsControl: ({ setMemberships, memberships, roles }: MembershipsControlProps) => JSX_2.Element;

export declare interface MembershipsControlProps {
    memberships: readonly MembershipInput[];
    setMemberships: (memberships: MembershipInput[]) => void;
    roles?: RolesConfig;
}

export declare const OtpConfirmFormFields: () => JSX_2.Element;

export declare const OtpPrepareFormFields: () => JSX_2.Element;

export declare const OtpSetup: () => JSX_2.Element | null;

export declare const PasswordResetFormFields: ({ hasToken }: {
    hasToken?: boolean;
}) => JSX_2.Element;

export declare const PasswordResetRequestFormFields: () => JSX_2.Element;

export declare const PersonList: (props: {
    controller?: {
        current?: MemberListController;
    };
    roles?: RolesConfig;
}) => JSX_2.Element;

export declare type RolesConfig = {
    [K in string]: {
        label: ReactNode;
        variables: {
            [K in string]: {
                label: ReactNode;
                render: React.ComponentType<VariableRendererProps>;
            };
        };
    };
};

/**
 * `UpdateProjectMemberFormFields` is a component for managing and updating a project member's roles and memberships.
 * It integrates with the `useUpdateProjectMemberForm` hook and supports role introspection.
 *
 * #### Example
 * ```tsx
 * <UpdateProjectMemberFormFields projectSlug="my-project" />
 * ```
 */
export declare const UpdateProjectMemberFormFields: ({ projectSlug, roles }: UpdateProjectMemberFormFieldsProps) => JSX_2.Element;

export declare type UpdateProjectMemberFormFieldsProps = {
    /** The slug of the project to which the member belongs. */
    projectSlug: string;
    /** Predefined roles configuration. If not provided, roles are introspected based on the `projectSlug`. */
    roles?: RolesConfig;
};

export declare const useIntrospectionRolesConfig: (projectSlug: string) => RolesConfig | undefined;

export declare type VariableRendererProps = {
    value: readonly string[];
    onChange: (newValues: readonly string[]) => void;
};

export { }
