import { ActivatePasswordlessOtpErrorCode } from '@contember/graphql-client-tenant';
import { ChangeMyPasswordErrorCode } from '@contember/graphql-client-tenant';
import { ConfirmOtpErrorCode } from '@contember/graphql-client-tenant';
import { Context } from 'react';
import { CreateApiKeyErrorCode } from '@contember/graphql-client-tenant';
import { CreatePasswordResetRequestErrorCode } from '@contember/graphql-client-tenant';
import { CreateSessionTokenErrorCode } from '@contember/graphql-client-tenant';
import { Fetcher } from 'graphql-ts-client-api';
import { InitSignInIDPErrorCode } from '@contember/graphql-client-tenant';
import { InviteErrorCode } from '@contember/graphql-client-tenant';
import { InviteOptions } from '@contember/graphql-client-tenant';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { MembershipInput } from '@contember/graphql-client-tenant';
import { ModelType } from 'graphql-ts-client-api';
import { MutationFetcher } from '@contember/graphql-client-tenant';
import { ReactElement } from 'react';
import { ReactNode } from 'react';
import { ResetPasswordErrorCode } from '@contember/graphql-client-tenant';
import { SetStateAction } from 'react';
import { SignInErrorCode } from '@contember/graphql-client-tenant';
import { SignInIDPErrorCode } from '@contember/graphql-client-tenant';
import * as TenantApi from '@contember/graphql-client-tenant';
import { UpdateProjectMemberErrorCode } from '@contember/graphql-client-tenant';

export declare type ActivatePasswordlessOtpMutationVariables = Parameters<ReturnType<typeof useActivatePasswordlessOtpMutation>>[0];

export declare const addProjectMemberMutation: TenantApi.MutationFetcher<{
    readonly mutation?: ({
        readonly ok: boolean;
    } & {
        readonly error?: ({
            readonly code: TenantApi.AddProjectMemberErrorCode;
        } & {
            readonly developerMessage: string;
        } & {
            readonly endUserMessage?: string;
        } & {
            readonly membershipValidation?: readonly ({
                readonly code: TenantApi.MembershipValidationErrorCode;
            } & {
                readonly role: string;
            } & {
                readonly variable?: string;
            })[] | undefined;
        }) | undefined;
    }) | undefined;
}, {
    readonly projectSlug: string;
    readonly identityId: string;
    readonly memberships: ReadonlyArray<TenantApi.MembershipInput>;
}>;

export declare type AddProjectMemberMutationVariables = Parameters<ReturnType<typeof useAddProjectMemberMutation>>[0];

export declare const ChangeMyPasswordForm: ({ children, onSuccess }: ChangeMyPasswordFormProps) => JSX_2.Element;

export declare type ChangeMyPasswordFormContextValue = FormContextValue<ChangeMyPasswordFormValues, ChangeMyPasswordFormErrorCode>;

export declare type ChangeMyPasswordFormError = FormError<ChangeMyPasswordFormValues, ChangeMyPasswordFormErrorCode>;

export declare type ChangeMyPasswordFormErrorCode = ChangeMyPasswordErrorCode | 'FIELD_REQUIRED' | 'INVALID_VALUE' | 'PASSWORD_MISMATCH' | 'UNKNOWN_ERROR';

export declare interface ChangeMyPasswordFormProps {
    children: ReactElement;
    onSuccess?: () => void;
}

export declare type ChangeMyPasswordFormState = FormState;

export declare type ChangeMyPasswordFormValues = {
    currentPassword: string;
    newPassword: string;
    passwordConfirmation: string;
};

export declare const changeMyPasswordMutation: TenantApi.MutationFetcher<{
    readonly mutation?: ({
        readonly ok: boolean;
    } & {
        readonly error?: ({
            readonly code: TenantApi.ChangeMyPasswordErrorCode;
        } & {
            readonly weakPasswordReasons?: ReadonlyArray<TenantApi.WeakPasswordReason>;
        } & {
            readonly developerMessage: string;
        }) | undefined;
    }) | undefined;
}, {
    readonly currentPassword: string;
    readonly newPassword: string;
}>;

export declare type ChangeMyPasswordMutationVariables = Parameters<ReturnType<typeof useChangeMyPasswordMutation>>[0];

export declare const changeMyProfile: TenantApi.MutationFetcher<{
    readonly mutation?: ({
        readonly ok: boolean;
    } & {
        readonly error?: ({
            readonly code: TenantApi.ChangeMyProfileErrorCode;
        } & {
            readonly developerMessage: string;
        }) | undefined;
    }) | undefined;
}, {
    readonly email?: string;
    readonly name?: string;
}>;

export declare type ChangeMyProfileMutationVariables = Parameters<ReturnType<typeof useChangeMyProfileMutation>>[0];

export declare const changeProfile: TenantApi.MutationFetcher<{
    readonly mutation?: ({
        readonly ok: boolean;
    } & {
        readonly error?: ({
            readonly code: TenantApi.ChangeProfileErrorCode;
        } & {
            readonly developerMessage: string;
        }) | undefined;
    }) | undefined;
}, {
    readonly personId: string;
    readonly email?: string;
    readonly name?: string;
}>;

export declare type ChangeProfileMutationVariables = Parameters<ReturnType<typeof useChangeProfileMutation>>[0];

export declare const confirmOtpMutation: TenantApi.MutationFetcher<{
    readonly mutation?: ({
        readonly ok: boolean;
    } & {
        readonly error?: ({
            readonly code: TenantApi.ConfirmOtpErrorCode;
        } & {
            readonly developerMessage: string;
        } & {
            readonly endUserMessage?: string;
        }) | undefined;
    }) | undefined;
}, {
    readonly otpToken: string;
}>;

export declare type ConfirmOtpMutationVariables = Parameters<ReturnType<typeof useConfirmOtpMutation>>[0];

export declare const CreateApiKeyForm: ({ children, onSuccess, projectSlug, initialMemberships }: CreateApiKeyFormProps) => JSX_2.Element;

export declare type CreateApiKeyFormContextValue = FormContextValue<CreateApiKeyFormValues, CreateApiKeyFormErrorCode>;

export declare type CreateApiKeyFormError = FormError<CreateApiKeyFormValues, CreateApiKeyFormErrorCode>;

export declare type CreateApiKeyFormErrorCode = CreateApiKeyErrorCode | 'UNKNOWN_ERROR' | 'FIELD_REQUIRED';

export declare interface CreateApiKeyFormProps {
    children: ReactElement;
    projectSlug: string;
    initialMemberships?: readonly MembershipInput[];
    onSuccess?: (args: {
        result: CreateApiKeyMutationResult;
    }) => void;
}

export declare type CreateApiKeyFormState = FormState;

export declare type CreateApiKeyFormValues = {
    description: string;
    memberships: readonly MembershipInput[];
};

export declare const createApiKeyMutation: TenantApi.MutationFetcher<{
    readonly mutation?: ({
        readonly ok: boolean;
    } & {
        readonly error?: ({
            readonly code: TenantApi.CreateApiKeyErrorCode;
        } & {
            readonly developerMessage: string;
        } & {
            readonly endUserMessage?: string;
        } & {
            readonly membershipValidation?: readonly ({
                readonly code: TenantApi.MembershipValidationErrorCode;
            } & {
                readonly role: string;
            } & {
                readonly variable?: string;
            })[] | undefined;
        }) | undefined;
    } & {
        readonly result?: {
            readonly apiKey: {
                readonly id: string;
            } & {
                readonly token?: string;
            } & {
                readonly identity: {
                    readonly id: string;
                } & {
                    readonly description?: string;
                } & {
                    readonly roles?: ReadonlyArray<string>;
                };
            };
        } | undefined;
    }) | undefined;
}, {
    readonly projectSlug: string;
    readonly memberships: ReadonlyArray<TenantApi.MembershipInput>;
    readonly description: string;
    readonly tokenHash?: string;
}>;

export declare type CreateApiKeyMutationResult = ModelType<typeof createApiKeyMutationResult>;

declare const createApiKeyMutationResult: TenantApi.CreateApiKeyResultFetcher<{
    readonly apiKey: {
        readonly id: string;
    } & {
        readonly token?: string;
    } & {
        readonly identity: {
            readonly id: string;
        } & {
            readonly description?: string;
        } & {
            readonly roles?: ReadonlyArray<string>;
        };
    };
}, {}>;

export declare type CreateApiKeyMutationVariables = Parameters<ReturnType<typeof useCreateApiKeyMutation>>[0];

export declare const createGlobalApiKeyMutation: TenantApi.MutationFetcher<{
    readonly mutation?: ({
        readonly ok: boolean;
    } & {
        readonly error?: ({
            readonly code: TenantApi.CreateApiKeyErrorCode;
        } & {
            readonly developerMessage: string;
        } & {
            readonly endUserMessage?: string;
        }) | undefined;
    } & {
        readonly result?: {
            readonly apiKey: {
                readonly id: string;
            } & {
                readonly token?: string;
            } & {
                readonly identity: {
                    readonly id: string;
                } & {
                    readonly description?: string;
                } & {
                    readonly roles?: ReadonlyArray<string>;
                };
            };
        } | undefined;
    }) | undefined;
}, {
    readonly description: string;
    readonly roles?: ReadonlyArray<string>;
    readonly tokenHash?: string;
}>;

export declare type CreateGlobalApiKeyMutationResult = ModelType<typeof createGlobalApiKeyMutationResult>;

declare const createGlobalApiKeyMutationResult: TenantApi.CreateApiKeyResultFetcher<{
    readonly apiKey: {
        readonly id: string;
    } & {
        readonly token?: string;
    } & {
        readonly identity: {
            readonly id: string;
        } & {
            readonly description?: string;
        } & {
            readonly roles?: ReadonlyArray<string>;
        };
    };
}, {}>;

export declare type CreateGlobalApiKeyMutationVariables = Parameters<ReturnType<typeof useCreateGlobalApiKeyMutation>>[0];

export declare const createResetPasswordRequestMutation: TenantApi.MutationFetcher<{
    readonly mutation?: ({
        readonly ok: boolean;
    } & {
        readonly error?: ({
            readonly code: TenantApi.CreatePasswordResetRequestErrorCode;
        } & {
            readonly developerMessage: string;
        } & {
            readonly endUserMessage?: string;
        }) | undefined;
    }) | undefined;
}, {
    readonly email: string;
    readonly options?: TenantApi.CreateResetPasswordRequestOptions;
}>;

export declare type CreateResetPasswordRequestMutationVariables = Parameters<ReturnType<typeof useCreateResetPasswordRequestMutation>>[0];

export declare const CreateSessionTokenForm: ({ children, onSuccess, expiration, apiToken }: CreateSessionTokenFormProps) => JSX_2.Element;

export declare type CreateSessionTokenFormContextValue = FormContextValue<CreateSessionTokenFormValues, CreateSessionTokenFormErrorCode>;

export declare type CreateSessionTokenFormError = FormError<CreateSessionTokenFormValues, CreateSessionTokenFormErrorCode>;

export declare type CreateSessionTokenFormErrorCode = CreateSessionTokenErrorCode | 'UNKNOWN_ERROR' | 'FIELD_REQUIRED';

export declare interface CreateSessionTokenFormProps {
    children: ReactElement;
    expiration?: number;
    apiToken?: string;
    onSuccess?: (args: {
        result: CreateSessionTokenMutationResult;
    }) => void;
}

export declare type CreateSessionTokenFormState = FormState;

export declare type CreateSessionTokenFormValues = {
    email: string;
};

export declare const createSessionTokenMutation: TenantApi.MutationFetcher<{
    readonly mutation?: ({
        readonly ok: boolean;
    } & {
        readonly error?: ({
            readonly code: TenantApi.CreateSessionTokenErrorCode;
        } & {
            readonly developerMessage: string;
        }) | undefined;
    } & {
        readonly result?: ({
            readonly token: string;
        } & {
            readonly person: {
                readonly id: string;
            } & {
                readonly email?: string;
            } & {
                readonly name?: string;
            };
        }) | undefined;
    }) | undefined;
}, {
    readonly email?: string;
    readonly personId?: string;
    readonly expiration?: number;
}>;

export declare type CreateSessionTokenMutationResult = ModelType<typeof createSessionTokenMutationResult>;

declare const createSessionTokenMutationResult: TenantApi.CreateSessionTokenResultFetcher<{
    readonly token: string;
} & {
    readonly person: {
        readonly id: string;
    } & {
        readonly email?: string;
    } & {
        readonly name?: string;
    };
}, {}>;

export declare type CreateSessionTokenMutationVariables = Parameters<ReturnType<typeof useCreateSessionTokenMutation>>[0];

export declare const createTenantMutation: <TResult, TError extends string = never, TVariables extends object = {}>(fetcher: MutationFetcher<TenantMutation<TResult, TError>, TVariables>, defaultOptions?: TenantApiOptions) => ({ headers, apiToken }?: TenantApiOptions) => (variables: TVariables) => Promise<TenantMutationResponse<TResult, TError>>;

export declare const disableApiKeyMutation: TenantApi.MutationFetcher<{
    readonly mutation?: ({
        readonly ok: boolean;
    } & {
        readonly error?: ({
            readonly code: TenantApi.DisableApiKeyErrorCode;
        } & {
            readonly developerMessage: string;
        } & {
            readonly endUserMessage?: string;
        }) | undefined;
    }) | undefined;
}, {
    readonly id: string;
}>;

export declare type DisableApiKeyMutationVariables = Parameters<ReturnType<typeof useDisableApiKeyMutation>>[0];

export declare const disableOtpMutation: TenantApi.MutationFetcher<{
    readonly mutation?: ({
        readonly ok: boolean;
    } & {
        readonly error?: ({
            readonly code: TenantApi.DisableOtpErrorCode;
        } & {
            readonly developerMessage: string;
        } & {
            readonly endUserMessage?: string;
        }) | undefined;
    }) | undefined;
}, {}>;

export declare type DisableOtpMutationVariables = Parameters<ReturnType<typeof useDisableOtpMutation>>[0];

export declare const DisableOtpTrigger: ({ onSuccess, ...props }: DisableOtpTriggerProps) => JSX_2.Element;

export declare interface DisableOtpTriggerProps {
    children: ReactElement;
    onSuccess?: () => void;
    onError?: (e: unknown) => void;
}

/** @internal */
export declare const FormContext: Context<FormContextValue<any, any, any>>;

export declare interface FormContextValue<V extends FormValueType, E extends string, S extends string = never> {
    values: V;
    state: FormState | S;
    setValues: (values: SetStateAction<V>) => void;
    setValue: <F extends keyof V>(field: F, value: V[F]) => void;
    errors: FormError<V, E>[];
}

export declare type FormError<V extends FormValueType, E extends string> = {
    field?: keyof V;
    code: FormErrorCode | E;
    developerMessage?: string;
};

export declare type FormErrorCode = 'UNKNOWN_ERROR';

export declare type FormState = 'loading' | 'initial' | 'submitting' | 'error' | 'success';

declare type FormValueType = Record<string, unknown>;

export declare interface Identity {
    readonly id: string;
    readonly roles: readonly string[];
    readonly person?: Person;
    readonly projects: IdentityProject[];
    readonly permissions: {
        readonly canCreateProject: boolean;
    };
}

/** @internal */
export declare const IdentityContext: Context<Identity | undefined>;

declare const identityFragment: TenantApi.IdentityFetcher<{
    readonly id: string;
} & {
    readonly description?: string;
} & {
    readonly roles?: ReadonlyArray<string>;
} & {
    readonly person?: ({
        readonly id: string;
    } & {
        readonly email?: string;
    } & {
        readonly name?: string;
    } & {
        readonly otpEnabled: boolean;
    }) | undefined;
} & {
    readonly projects: readonly ({
        readonly project: {
            readonly id: string;
        } & {
            readonly name: string;
        } & {
            readonly slug: string;
        } & {
            readonly config: unknown;
        };
    } & {
        readonly memberships: readonly ({
            readonly role: string;
        } & {
            readonly variables: readonly ({
                readonly name: string;
            } & {
                readonly values: ReadonlyArray<string>;
            })[];
        })[];
    })[];
} & {
    readonly permissions?: ({
        readonly canCreateProject: boolean;
    } & {
        readonly canDeployEntrypoint: boolean;
    }) | undefined;
}, {}>;

export declare interface IdentityMethods {
    clearIdentity: () => void;
    refreshIdentity: () => Promise<void>;
}

/** @internal */
export declare const IdentityMethodsContext: Context<IdentityMethods>;

export declare interface IdentityProject {
    readonly slug: string;
    readonly name: string;
    readonly roles: readonly string[];
}

export declare const IdentityProvider: React.FC<IdentityProviderProps>;

export declare interface IdentityProviderProps {
    children: ReactNode;
}

export declare const IdentityState: ({ state, children }: IdentityStateProps) => JSX_2.Element | null;

/** @internal */
export declare const IdentityStateContext: Context<IdentityStateValue>;

export declare interface IdentityStateProps {
    state: IdentityStateValue | IdentityStateValue[];
    children: ReactNode;
}

export declare type IdentityStateValue = 'none' | 'loading' | 'failed' | 'cleared' | 'success';

export declare const IDP: ({ children, onResponseError, onInitError, onLogin, expiration }: IDPProps) => JSX_2.Element;

export declare type IDPInitError = InitSignInIDPErrorCode | 'UNKNOWN_ERROR';

export declare const IDPInitTrigger: ({ identityProvider, ...props }: IDPInitTriggerProps) => JSX_2.Element;

export declare interface IDPInitTriggerProps {
    children: ReactElement;
    identityProvider: string;
}

export declare type IDPMethods = {
    initRedirect: (args: {
        provider: string;
    }) => Promise<{
        ok: true;
    } | {
        ok: false;
        error: IDPInitError;
    }>;
};

/** @internal */
export declare const IDPMethodsContextProvider: Context<IDPMethods>;

export declare interface IDPProps {
    children: ReactNode;
    onLogin?: () => void;
    onInitError?: (error: IDPInitError) => void;
    onResponseError?: (error: IDPResponseError) => void;
    expiration?: number;
}

export declare type IDPResponseError = SignInIDPErrorCode | 'INVALID_LOCAL_STATE' | 'UNKNOWN_ERROR';

export declare const IDPState: ({ state, children }: IDPStateProps) => JSX_2.Element | null;

/** @internal */
export declare const IDPStateContextProvider: Context<IDPStateValue>;

export declare interface IDPStateProps {
    state: IDPStateType | IDPStateType[];
    children: ReactNode;
}

export declare type IDPStateType = IDPStateValue['type'];

export declare type IDPStateValue = {
    type: 'nothing';
} | {
    type: 'processing_init';
} | {
    type: 'processing_response';
} | {
    type: 'success';
} | {
    type: 'init_failed';
    error: IDPInitError;
} | {
    type: 'response_failed';
    error: IDPResponseError;
};

export declare type InitSignInIDPMutationResult = ModelType<typeof TenantApi.initSignInIDPResult$$>;

export declare type InitSignInIDPMutationVariables = {
    identityProvider: string;
    data: {
        redirectUrl?: string;
    } & {
        [key: string]: string;
    };
};

export declare type InitSignInPasswordlessMutationResult = ModelType<typeof InitSignInPasswordlessMutationResult_2>;

declare const InitSignInPasswordlessMutationResult_2: TenantApi.InitSignInPasswordlessResultFetcher<{
    readonly requestId: string;
} & {
    readonly expiresAt: string;
}, {}>;

declare type InitSignInPasswordlessMutationResult = ModelType<typeof InitSignInPasswordlessMutationResult_2>;

export declare type InitSignInPasswordlessMutationVariables = Parameters<ReturnType<typeof useInitSignInPasswordlessMutation>>[0];

export declare const InviteForm: ({ children, onSuccess, projectSlug, initialMemberships, inviteOptions }: InviteFormProps) => JSX_2.Element;

export declare type InviteFormContextValue = FormContextValue<InviteFormValues, InviteFormErrorCode>;

export declare type InviteFormError = FormError<InviteFormValues, InviteFormErrorCode>;

export declare type InviteFormErrorCode = InviteErrorCode | 'UNKNOWN_ERROR' | 'FIELD_REQUIRED';

export declare interface InviteFormProps {
    children: ReactElement;
    projectSlug: string;
    inviteOptions?: InviteOptions;
    initialMemberships?: readonly MembershipInput[];
    onSuccess?: (args: {
        result: InviteMutationResult;
    }) => void;
}

export declare type InviteFormState = FormState;

export declare type InviteFormValues = {
    email: string;
    name: string;
    memberships: readonly MembershipInput[];
};

export declare const inviteMutation: TenantApi.MutationFetcher<{
    readonly mutation?: ({
        readonly ok: boolean;
    } & {
        readonly error?: ({
            readonly code: TenantApi.InviteErrorCode;
        } & {
            readonly developerMessage: string;
        } & {
            readonly endUserMessage?: string;
        } & {
            readonly membershipValidation?: readonly ({
                readonly code: TenantApi.MembershipValidationErrorCode;
            } & {
                readonly role: string;
            } & {
                readonly variable?: string;
            })[] | undefined;
        }) | undefined;
    } & {
        readonly result?: ({
            readonly isNew: boolean;
        } & {
            readonly person: {
                readonly id: string;
            } & {
                readonly email?: string;
            } & {
                readonly name?: string;
            } & {
                readonly identity: {
                    readonly id: string;
                } & {
                    readonly description?: string;
                } & {
                    readonly roles?: ReadonlyArray<string>;
                };
            };
        }) | undefined;
    }) | undefined;
}, {
    readonly email: string;
    readonly name?: string;
    readonly projectSlug: string;
    readonly memberships: ReadonlyArray<TenantApi.MembershipInput>;
    readonly options?: TenantApi.InviteOptions;
}>;

export declare type InviteMutationResult = ModelType<typeof inviteMutationResult>;

declare const inviteMutationResult: TenantApi.InviteResultFetcher<{
    readonly isNew: boolean;
} & {
    readonly person: {
        readonly id: string;
    } & {
        readonly email?: string;
    } & {
        readonly name?: string;
    } & {
        readonly identity: {
            readonly id: string;
        } & {
            readonly description?: string;
        } & {
            readonly roles?: ReadonlyArray<string>;
        };
    };
}, {}>;

export declare type InviteMutationVariables = Parameters<ReturnType<typeof useInviteMutation>>[0];

export declare const LoginForm: ({ children, expiration, onSuccess }: LoginFormProps) => JSX_2.Element;

export declare type LoginFormContextValue = FormContextValue<LoginFormValues, LoginFormErrorCode, LoginFormState>;

export declare type LoginFormError = FormError<LoginFormValues, LoginFormErrorCode>;

export declare type LoginFormErrorCode = SignInErrorCode | 'FIELD_REQUIRED' | 'INVALID_VALUE' | 'UNKNOWN_ERROR';

export declare interface LoginFormProps {
    expiration?: number;
    children: ReactElement;
    onSuccess?: () => void;
}

export declare type LoginFormState = FormState | 'otp-required';

export declare type LoginFormValues = {
    email: string;
    password: string;
    otpToken: string;
};

export declare const LoginToken: unique symbol;

export declare const LogoutTrigger: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element;

export declare type MeQueryData = ModelType<typeof identityFragment>;

export { ModelType }

export declare const OtpConfirmForm: ({ children, onSuccess }: OtpConfirmFormProps) => JSX_2.Element;

export declare type OtpConfirmFormContextValue = FormContextValue<OtpConfirmFormValues, OtpConfirmFormErrorCode>;

export declare type OtpConfirmFormError = FormError<OtpConfirmFormValues, OtpConfirmFormErrorCode>;

export declare type OtpConfirmFormErrorCode = ConfirmOtpErrorCode | 'FIELD_REQUIRED' | 'UNKNOWN_ERROR';

export declare interface OtpConfirmFormProps {
    children: ReactElement;
    onSuccess?: () => void;
}

export declare type OtpConfirmFormState = FormState;

export declare type OtpConfirmFormValues = {
    otpToken: string;
};

export declare const OtpPrepareForm: ({ children, onSuccess }: OtpPrepareFormProps) => JSX_2.Element;

export declare type OtpPrepareFormContextValue = FormContextValue<OtpPrepareFormValues, OtpPrepareFormErrorCode>;

export declare type OtpPrepareFormError = FormError<OtpPrepareFormValues, OtpPrepareFormErrorCode>;

export declare type OtpPrepareFormErrorCode = 'UNKNOWN_ERROR';

export declare interface OtpPrepareFormProps {
    children: ReactElement;
    onSuccess?: (args: {
        result: PrepareOtpMutationResult;
    }) => void;
}

export declare type OtpPrepareFormState = FormState;

export declare type OtpPrepareFormValues = {
    label: string;
};

export declare type PasswordlessResponseHandlerState = {
    type: 'empty';
} | {
    type: 'otp_activating';
} | {
    type: 'otp_activated';
    otp: string;
} | {
    type: 'otp_activation_failed';
    error: ActivatePasswordlessOtpErrorCode | 'UNKNOWN_ERROR';
} | {
    type: 'can_proceed_to_login';
};

export declare const PasswordlessSignInForm: ({ children, onSuccess, requestId, validationType, token, expiration }: PasswordlessSignInFormProps) => JSX_2.Element;

export declare type PasswordlessSignInFormContextValue = FormContextValue<PasswordlessSignInFormValues, PasswordlessSignInFormErrorCode, PasswordlessSignInFormState>;

export declare type PasswordlessSignInFormError = FormError<PasswordlessSignInFormValues, PasswordlessSignInFormErrorCode>;

export declare type PasswordlessSignInFormErrorCode = TenantApi.SignInPasswordlessErrorCode | 'FIELD_REQUIRED' | 'INVALID_VALUE' | 'UNKNOWN_ERROR';

export declare interface PasswordlessSignInFormProps {
    requestId: string;
    validationType: TenantApi.PasswordlessValidationType;
    token?: string;
    expiration?: number;
    children: ReactElement;
    onSuccess?: () => void;
}

export declare type PasswordlessSignInFormState = FormState | 'otp-required';

export declare type PasswordlessSignInFormValues = {
    token: string;
    otpToken: string;
};

export declare const PasswordlessSignInInitForm: ({ children, onSuccess }: PasswordlessSignInInitFormProps) => JSX_2.Element;

export declare type PasswordlessSignInInitFormContextValue = FormContextValue<PasswordlessSignInInitFormValues, PasswordlessSignInInitFormErrorCode>;

export declare type PasswordlessSignInInitFormError = FormError<PasswordlessSignInInitFormValues, PasswordlessSignInInitFormErrorCode>;

export declare type PasswordlessSignInInitFormErrorCode = TenantApi.InitSignInPasswordlessErrorCode | 'FIELD_REQUIRED' | 'INVALID_VALUE' | 'UNKNOWN_ERROR';

export declare interface PasswordlessSignInInitFormProps {
    children: ReactElement;
    onSuccess?: (args: {
        result: InitSignInPasswordlessMutationResult;
    }) => void;
}

export declare type PasswordlessSignInInitFormState = FormState;

export declare type PasswordlessSignInInitFormValues = {
    email: string;
};

export declare const PasswordResetForm: ({ children, onSuccess, token }: PasswordResetFormProps) => JSX_2.Element;

export declare type PasswordResetFormContextValue = FormContextValue<PasswordResetFormValues, PasswordResetFormErrorCode>;

export declare type PasswordResetFormError = FormError<PasswordResetFormValues, PasswordResetFormErrorCode>;

export declare type PasswordResetFormErrorCode = ResetPasswordErrorCode | 'FIELD_REQUIRED' | 'INVALID_VALUE' | 'PASSWORD_MISMATCH' | 'UNKNOWN_ERROR';

export declare interface PasswordResetFormProps {
    children: ReactElement;
    onSuccess?: () => void;
    token?: string;
}

export declare type PasswordResetFormState = FormState;

export declare type PasswordResetFormValues = {
    token: string;
    password: string;
    passwordConfirmation: string;
};

export declare const PasswordResetRequestForm: ({ children, onSuccess }: PasswordResetRequestFormProps) => JSX_2.Element;

export declare type PasswordResetRequestFormContextValue = FormContextValue<PasswordResetRequestFormValues, PasswordResetRequestFormErrorCode>;

export declare type PasswordResetRequestFormError = FormError<PasswordResetRequestFormValues, PasswordResetRequestFormErrorCode>;

export declare type PasswordResetRequestFormErrorCode = CreatePasswordResetRequestErrorCode | 'FIELD_REQUIRED' | 'INVALID_VALUE' | 'UNKNOWN_ERROR';

export declare interface PasswordResetRequestFormProps {
    children: ReactElement;
    onSuccess?: () => void;
}

export declare type PasswordResetRequestFormState = FormState;

export declare type PasswordResetRequestFormValues = {
    email: string;
};

export declare interface Person {
    readonly id: string;
    readonly email?: string;
    readonly otpEnabled: boolean;
}

export declare const prepareOtpMutation: TenantApi.MutationFetcher<{
    readonly mutation?: ({
        readonly ok: boolean;
    } & {
        readonly result?: ({
            readonly otpUri: string;
        } & {
            readonly otpSecret: string;
        }) | undefined;
    }) | undefined;
}, {
    readonly label?: string;
}>;

export declare type PrepareOtpMutationResult = ModelType<typeof TenantApi.prepareOtpResult$$>;

export declare type PrepareOtpMutationVariables = Parameters<ReturnType<typeof usePrepareOtpMutation>>[0];

declare const projectIdentityRelationFragment: TenantApi.ProjectIdentityRelationFetcher<{
    readonly identity: {
        readonly id: string;
    } & {
        readonly description?: string;
    } & {
        readonly roles?: ReadonlyArray<string>;
    } & {
        readonly person?: ({
            readonly id: string;
        } & {
            readonly email?: string;
        } & {
            readonly name?: string;
        } & {
            readonly otpEnabled: boolean;
        }) | undefined;
    } & {
        readonly apiKey?: {
            readonly id: string;
        } | undefined;
    };
} & {
    readonly memberships: readonly ({
        readonly role: string;
    } & {
        readonly variables: readonly ({
            readonly name: string;
        } & {
            readonly values: ReadonlyArray<string>;
        })[];
    })[];
}, {}>;

declare const projectMembershipsFragment: TenantApi.MembershipFetcher<{
    readonly role: string;
} & {
    readonly variables: readonly ({
        readonly name: string;
    } & {
        readonly values: ReadonlyArray<string>;
    })[];
}, {}>;

export declare type ProjectMembershipsQueryResult = readonly ModelType<typeof projectMembershipsFragment>[];

export declare type ProjectMembershipsQueryVariables = {
    projectSlug: string;
    identityId: string;
};

export declare type ProjectMembersQueryResult = readonly ModelType<typeof projectIdentityRelationFragment>[];

export declare type ProjectMembersQueryVariables = {
    projectSlug: string;
} & TenantApi.ProjectMembersInput;

export declare type ProjectRoleDefinition = ModelType<typeof projectRolesDefinitionFragment>;

declare const projectRolesDefinitionFragment: TenantApi.RoleDefinitionFetcher<{
    readonly name: string;
} & {
    readonly variables: readonly (({
        readonly name: string;
    } & {
        readonly __typename: "RoleVariableDefinition" | "RoleConditionVariableDefinition" | "RoleEntityVariableDefinition" | "RolePredefinedVariableDefinition";
    } & {
        readonly name: string;
    } & {
        readonly __typename: "RoleConditionVariableDefinition";
    } & {
        __typename: "RoleVariableDefinition" | "RoleConditionVariableDefinition" | "RolePredefinedVariableDefinition";
    } & {
        __typename: "RoleVariableDefinition" | "RoleConditionVariableDefinition" | "RoleEntityVariableDefinition";
    }) | ({
        readonly name: string;
    } & {
        readonly __typename: "RoleVariableDefinition" | "RoleConditionVariableDefinition" | "RoleEntityVariableDefinition" | "RolePredefinedVariableDefinition";
    } & {
        __typename: "RoleVariableDefinition" | "RoleEntityVariableDefinition" | "RolePredefinedVariableDefinition";
    } & {
        readonly name: string;
    } & {
        readonly entityName: string;
    } & {
        readonly __typename: "RoleEntityVariableDefinition";
    } & {
        __typename: "RoleVariableDefinition" | "RoleConditionVariableDefinition" | "RoleEntityVariableDefinition";
    }) | ({
        readonly name: string;
    } & {
        readonly __typename: "RoleVariableDefinition" | "RoleConditionVariableDefinition" | "RoleEntityVariableDefinition" | "RolePredefinedVariableDefinition";
    } & {
        __typename: "RoleVariableDefinition" | "RoleEntityVariableDefinition" | "RolePredefinedVariableDefinition";
    } & {
        __typename: "RoleVariableDefinition" | "RoleConditionVariableDefinition" | "RolePredefinedVariableDefinition";
    } & {
        readonly name: string;
    } & {
        readonly value: string;
    } & {
        readonly __typename: "RolePredefinedVariableDefinition";
    }) | ({
        readonly name: string;
    } & {
        readonly __typename: "RoleVariableDefinition" | "RoleConditionVariableDefinition" | "RoleEntityVariableDefinition" | "RolePredefinedVariableDefinition";
    } & {
        __typename: "RoleVariableDefinition" | "RoleEntityVariableDefinition" | "RolePredefinedVariableDefinition";
    } & {
        __typename: "RoleVariableDefinition" | "RoleConditionVariableDefinition" | "RolePredefinedVariableDefinition";
    } & {
        __typename: "RoleVariableDefinition" | "RoleConditionVariableDefinition" | "RoleEntityVariableDefinition";
    }))[];
}, {}>;

export declare type ProjectRolesDefinitionQueryResult = readonly ProjectRoleDefinition[];

export declare interface ProjectRolesDefinitionQueryVariables {
    slug: string;
}

export declare const removeProjectMemberMutation: TenantApi.MutationFetcher<{
    readonly mutation?: ({
        readonly ok: boolean;
    } & {
        readonly error?: ({
            readonly code: TenantApi.RemoveProjectMemberErrorCode;
        } & {
            readonly developerMessage: string;
        } & {
            readonly endUserMessage?: string;
        }) | undefined;
    }) | undefined;
}, {
    readonly projectSlug: string;
    readonly identityId: string;
}>;

export declare type RemoveProjectMemberMutationVariables = Parameters<ReturnType<typeof useRemoveProjectMemberMutation>>[0];

export declare const RemoveProjectMemberTrigger: ({ identityId, projectSlug, ...props }: RemoveProjectMemberTriggerProps) => JSX_2.Element;

export declare type RemoveProjectMemberTriggerProps = RemoveProjectMemberMutationVariables & {
    children: ReactElement;
    onSuccess?: () => void;
    onError?: (e: unknown) => void;
};

export declare const resetPasswordMutation: TenantApi.MutationFetcher<{
    readonly mutation?: ({
        readonly ok: boolean;
    } & {
        readonly error?: ({
            readonly code: TenantApi.ResetPasswordErrorCode;
        } & {
            readonly weakPasswordReasons?: ReadonlyArray<TenantApi.WeakPasswordReason>;
        } & {
            readonly developerMessage: string;
        } & {
            readonly endUserMessage?: string;
        }) | undefined;
    }) | undefined;
}, {
    readonly token: string;
    readonly password: string;
}>;

export declare type ResetPasswordMutationVariables = Parameters<ReturnType<typeof useResetPasswordMutation>>[0];

declare const signInIdpFragment: TenantApi.SignInIDPResultFetcher<{
    readonly token: string;
} & {
    readonly idpResponse?: unknown;
} & {
    readonly person: {
        readonly id: string;
    } & {
        readonly email?: string;
    } & {
        readonly name?: string;
    };
}, {}>;

export declare const signInIDPMutation: TenantApi.MutationFetcher<{
    readonly mutation?: ({
        readonly ok: boolean;
    } & {
        readonly error?: ({
            readonly code: TenantApi.SignInIDPErrorCode;
        } & {
            readonly developerMessage: string;
        } & {
            readonly endUserMessage?: string;
        }) | undefined;
    } & {
        readonly result?: ({
            readonly token: string;
        } & {
            readonly idpResponse?: unknown;
        } & {
            readonly person: {
                readonly id: string;
            } & {
                readonly email?: string;
            } & {
                readonly name?: string;
            };
        }) | undefined;
    }) | undefined;
}, {
    readonly identityProvider: string;
    readonly data?: unknown;
    readonly expiration?: number;
    readonly idpResponse?: TenantApi.IDPResponseInput;
    readonly redirectUrl?: string;
    readonly sessionData?: unknown;
}>;

export declare type SignInIDPMutationResult = ModelType<typeof signInIdpFragment>;

export declare type SignInIDPMutationVariables = {
    identityProvider: string;
    expiration?: number;
    data: {
        url?: string;
        redirectUrl?: string;
        sessionData?: any;
    } & {
        [key: string]: any;
    };
};

export declare const signInMutation: TenantApi.MutationFetcher<{
    readonly mutation?: ({
        readonly ok: boolean;
    } & {
        readonly error?: ({
            readonly code: TenantApi.SignInErrorCode;
        } & {
            readonly developerMessage: string;
        } & {
            readonly endUserMessage?: string;
        } & {
            readonly retryAfter?: number;
        }) | undefined;
    } & {
        readonly result?: ({
            readonly token: string;
        } & {
            readonly person: {
                readonly id: string;
            } & {
                readonly email?: string;
            } & {
                readonly name?: string;
            };
        }) | undefined;
    }) | undefined;
}, {
    readonly email: string;
    readonly password: string;
    readonly expiration?: number;
    readonly otpToken?: string;
}>;

export declare type SignInMutationResult = ModelType<typeof signInResultFragment>;

export declare type SignInMutationVariables = Parameters<ReturnType<typeof useSignInMutation>>[0];

export declare type SignInPasswordlessMutationResult = ModelType<typeof signInResultFragment_2>;

export declare type SignInPasswordlessMutationVariables = Parameters<ReturnType<typeof useSignInPasswordlessMutation>>[0];

declare const signInResultFragment: TenantApi.SignInResultFetcher<{
    readonly token: string;
} & {
    readonly person: {
        readonly id: string;
    } & {
        readonly email?: string;
    } & {
        readonly name?: string;
    };
}, {}>;

declare const signInResultFragment_2: TenantApi.SignInPasswordlessResultFetcher<{
    readonly token: string;
} & {
    readonly person: {
        readonly id: string;
    } & {
        readonly email?: string;
    } & {
        readonly name?: string;
    };
}, {}>;

export declare const signOutMutation: TenantApi.MutationFetcher<{
    readonly mutation?: ({
        readonly ok: boolean;
    } & {
        readonly error?: ({
            readonly code: TenantApi.SignOutErrorCode;
        } & {
            readonly developerMessage: string;
        } & {
            readonly endUserMessage?: string;
        }) | undefined;
    }) | undefined;
}, {
    readonly all?: boolean;
}>;

export declare type SignOutMutationVariables = Parameters<ReturnType<typeof useSignOutMutation>>[0];

export declare type TenantApiOptions = {
    readonly headers?: Record<string, string>;
    readonly apiToken?: string | typeof LoginToken;
};

export declare type TenantMutation<Result, Error> = {
    readonly mutation?: {
        readonly ok: boolean;
        readonly error?: {
            readonly code: Error;
            readonly developerMessage: string;
        };
        readonly result?: Result;
    };
};

export declare type TenantMutationErrorResponse<Error> = {
    ok: false;
    error: Error;
    developerMessage?: string;
};

export declare type TenantMutationOkResponse<Result> = {
    ok: true;
    result: Result;
};

export declare type TenantMutationResponse<Result, Error> = TenantMutationOkResponse<Result> | TenantMutationErrorResponse<Error>;

export declare type TenantQueryLoaderMethods = {
    refresh: () => void;
};

export declare type TenantQueryLoaderState<Result> = {
    state: 'loading';
} | {
    state: 'error';
    error: unknown;
} | {
    state: 'success';
    data: Result;
} | {
    state: 'refreshing';
    data: Result;
};

export declare const UpdateProjectMemberForm: ({ children, onSuccess, identityId, projectSlug }: UpdateProjectMemberFormProps) => JSX_2.Element;

export declare type UpdateProjectMemberFormContextValue = FormContextValue<UpdateProjectMemberFormValues, UpdateProjectMemberFormErrorCode>;

export declare type UpdateProjectMemberFormError = FormError<UpdateProjectMemberFormValues, UpdateProjectMemberFormErrorCode>;

export declare type UpdateProjectMemberFormErrorCode = UpdateProjectMemberErrorCode | 'UNKNOWN_ERROR' | 'FIELD_REQUIRED';

export declare interface UpdateProjectMemberFormProps {
    children: ReactElement;
    identityId: string;
    projectSlug: string;
    onSuccess?: (args: {}) => void;
}

export declare type UpdateProjectMemberFormState = FormState;

export declare type UpdateProjectMemberFormValues = {
    memberships: readonly MembershipInput[];
};

export declare const updateProjectMemberMutation: TenantApi.MutationFetcher<{
    readonly mutation?: ({
        readonly ok: boolean;
    } & {
        readonly error?: ({
            readonly code: TenantApi.UpdateProjectMemberErrorCode;
        } & {
            readonly developerMessage: string;
        } & {
            readonly endUserMessage?: string;
        } & {
            readonly membershipValidation?: readonly ({
                readonly code: TenantApi.MembershipValidationErrorCode;
            } & {
                readonly role: string;
            } & {
                readonly variable?: string;
            })[] | undefined;
        }) | undefined;
    }) | undefined;
}, {
    readonly projectSlug: string;
    readonly identityId: string;
    readonly memberships: ReadonlyArray<TenantApi.MembershipInput>;
}>;

export declare type UpdateProjectMemberMutationVariables = Parameters<ReturnType<typeof useUpdateProjectMemberMutation>>[0];

export declare const useActivatePasswordlessOtpMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {
    readonly requestId: string;
    readonly token: string;
    readonly otpHash: string;
}) => Promise<TenantMutationResponse<unknown, TenantApi.ActivatePasswordlessOtpErrorCode>>;

export declare const useAddProjectMemberMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {
    readonly projectSlug: string;
    readonly identityId: string;
    readonly memberships: ReadonlyArray<TenantApi.MembershipInput>;
}) => Promise<TenantMutationResponse<unknown, TenantApi.AddProjectMemberErrorCode>>;

export declare const useChangeMyPasswordForm: () => ChangeMyPasswordFormContextValue;

export declare const useChangeMyPasswordMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {
    readonly currentPassword: string;
    readonly newPassword: string;
}) => Promise<TenantMutationResponse<unknown, TenantApi.ChangeMyPasswordErrorCode>>;

export declare const useChangeMyProfileMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {
    readonly email?: string;
    readonly name?: string;
}) => Promise<TenantMutationResponse<unknown, TenantApi.ChangeMyProfileErrorCode>>;

export declare const useChangeProfileMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {
    readonly personId: string;
    readonly email?: string;
    readonly name?: string;
}) => Promise<TenantMutationResponse<unknown, TenantApi.ChangeProfileErrorCode>>;

export declare const useConfirmOtpMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {
    readonly otpToken: string;
}) => Promise<TenantMutationResponse<unknown, TenantApi.ConfirmOtpErrorCode>>;

export declare const useCreateApiKeyForm: () => CreateApiKeyFormContextValue;

export declare const useCreateApiKeyMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {
    readonly projectSlug: string;
    readonly memberships: ReadonlyArray<TenantApi.MembershipInput>;
    readonly description: string;
    readonly tokenHash?: string;
}) => Promise<TenantMutationResponse<    {
readonly apiKey: {
readonly id: string;
} & {
readonly token?: string;
} & {
readonly identity: {
readonly id: string;
} & {
readonly description?: string;
} & {
readonly roles?: ReadonlyArray<string>;
};
};
}, TenantApi.CreateApiKeyErrorCode>>;

export declare const useCreateGlobalApiKeyMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {
    readonly description: string;
    readonly roles?: ReadonlyArray<string>;
    readonly tokenHash?: string;
}) => Promise<TenantMutationResponse<    {
readonly apiKey: {
readonly id: string;
} & {
readonly token?: string;
} & {
readonly identity: {
readonly id: string;
} & {
readonly description?: string;
} & {
readonly roles?: ReadonlyArray<string>;
};
};
}, TenantApi.CreateApiKeyErrorCode>>;

export declare const useCreateResetPasswordRequestMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {
    readonly email: string;
    readonly options?: TenantApi.CreateResetPasswordRequestOptions;
}) => Promise<TenantMutationResponse<unknown, "PERSON_NOT_FOUND">>;

export declare const useCreateSessionTokenForm: () => CreateSessionTokenFormContextValue;

export declare const useCreateSessionTokenMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {
    readonly email?: string;
    readonly personId?: string;
    readonly expiration?: number;
}) => Promise<TenantMutationResponse<    {
readonly token: string;
} & {
readonly person: {
readonly id: string;
} & {
readonly email?: string;
} & {
readonly name?: string;
};
}, TenantApi.CreateSessionTokenErrorCode>>;

export declare const useDisableApiKeyMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {
    readonly id: string;
}) => Promise<TenantMutationResponse<unknown, "KEY_NOT_FOUND">>;

export declare const useDisableMyPasswordlessMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {}) => Promise<TenantMutationResponse<unknown, TenantApi.ToggleMyPasswordlessErrorCode>>;

export declare const useDisableOtpMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {}) => Promise<TenantMutationResponse<unknown, "OTP_NOT_ACTIVE">>;

export declare const useEnableMyPasswordlessMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {}) => Promise<TenantMutationResponse<unknown, TenantApi.ToggleMyPasswordlessErrorCode>>;

export declare const useFetchIdentity: () => [{
    state: IdentityStateValue;
    identity: Identity | undefined;
}, IdentityMethods];

export declare const useForm: () => FormContextValue<any, any, any>;

export declare const useIdentity: () => Identity | undefined;

export declare const useIdentityMethods: () => IdentityMethods;

export declare const useIdentityState: () => IdentityStateValue;

export declare const useIDPMethods: () => IDPMethods;

export declare const useIDPState: () => IDPStateValue;

export declare const useInitSignInIDPMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: InitSignInIDPMutationVariables) => Promise<TenantMutationResponse<    {
readonly authUrl: string;
} & {
readonly sessionData: unknown;
} & {
readonly idpConfiguration?: unknown;
}, TenantApi.InitSignInIDPErrorCode>>;

export declare const useInitSignInPasswordlessMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {
    readonly email: string;
    readonly options?: TenantApi.InitSignInPasswordlessOptions;
}) => Promise<TenantMutationResponse<    {
readonly requestId: string;
} & {
readonly expiresAt: string;
}, TenantApi.InitSignInPasswordlessErrorCode>>;

export declare const useInviteForm: () => InviteFormContextValue;

export declare const useInviteMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {
    readonly email: string;
    readonly name?: string;
    readonly projectSlug: string;
    readonly memberships: ReadonlyArray<TenantApi.MembershipInput>;
    readonly options?: TenantApi.InviteOptions;
}) => Promise<TenantMutationResponse<    {
readonly isNew: boolean;
} & {
readonly person: {
readonly id: string;
} & {
readonly email?: string;
} & {
readonly name?: string;
} & {
readonly identity: {
readonly id: string;
} & {
readonly description?: string;
} & {
readonly roles?: ReadonlyArray<string>;
};
};
}, TenantApi.InviteErrorCode>>;

export declare const useLoginForm: () => LoginFormContextValue;

export declare const useLogout: () => ({ noRedirect }?: {
    noRedirect?: boolean;
}) => Promise<void>;

export declare const useMeQuery: (options?: TenantApiOptions) => ({}: {}) => Promise<MeQueryData>;

export declare const useOtpConfirmForm: () => OtpConfirmFormContextValue;

export declare const useOtpPrepareForm: () => OtpPrepareFormContextValue;

export declare const usePasswordlessOtpActivator: ({ otpLength, otpChars }?: {
    otpLength?: number;
    otpChars?: string;
}) => PasswordlessResponseHandlerState;

export declare const usePasswordlessSignInForm: () => PasswordlessSignInFormContextValue;

export declare const usePasswordlessSignInInitForm: () => PasswordlessSignInInitFormContextValue;

export declare const usePasswordResetForm: () => PasswordResetFormContextValue;

export declare const usePasswordResetRequestForm: () => PasswordResetRequestFormContextValue;

export declare const usePrepareOtpMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {
    readonly label?: string;
}) => Promise<TenantMutationResponse<    {
readonly otpUri: string;
} & {
readonly otpSecret: string;
}, never>>;

export declare const useProjectMembershipsQuery: (options?: TenantApiOptions) => (input: ProjectMembershipsQueryVariables) => Promise<ProjectMembershipsQueryResult>;

export declare const useProjectMembersQuery: ({ headers, apiToken }?: TenantApiOptions) => ({ projectSlug, ...membersInput }: ProjectMembersQueryVariables) => Promise<ProjectMembersQueryResult>;

export declare const useProjectRolesDefinitionQuery: ({ headers, apiToken }?: TenantApiOptions) => (variables: ProjectRolesDefinitionQueryVariables) => Promise<ProjectRolesDefinitionQueryResult>;

export declare const useRemoveProjectMemberMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {
    readonly projectSlug: string;
    readonly identityId: string;
}) => Promise<TenantMutationResponse<unknown, TenantApi.RemoveProjectMemberErrorCode>>;

export declare const useResetPasswordMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {
    readonly token: string;
    readonly password: string;
}) => Promise<TenantMutationResponse<unknown, TenantApi.ResetPasswordErrorCode>>;

export declare const useSignInIDPMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: SignInIDPMutationVariables) => Promise<TenantMutationResponse<    {
readonly token: string;
} & {
readonly idpResponse?: unknown;
} & {
readonly person: {
readonly id: string;
} & {
readonly email?: string;
} & {
readonly name?: string;
};
}, TenantApi.SignInIDPErrorCode>>;

export declare const useSignInMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {
    readonly email: string;
    readonly password: string;
    readonly expiration?: number;
    readonly otpToken?: string;
}) => Promise<TenantMutationResponse<    {
readonly token: string;
} & {
readonly person: {
readonly id: string;
} & {
readonly email?: string;
} & {
readonly name?: string;
};
}, TenantApi.SignInErrorCode>>;

export declare const useSignInPasswordlessMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {
    readonly requestId: string;
    readonly validationType: TenantApi.PasswordlessValidationType;
    readonly token: string;
    readonly expiration?: number;
    readonly mfaOtp?: string;
}) => Promise<TenantMutationResponse<    {
readonly token: string;
} & {
readonly person: {
readonly id: string;
} & {
readonly email?: string;
} & {
readonly name?: string;
};
}, TenantApi.SignInPasswordlessErrorCode>>;

export declare const useSignOutMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {
    readonly all?: boolean;
}) => Promise<TenantMutationResponse<unknown, TenantApi.SignOutErrorCode>>;

export declare const useTenantApi: ({ headers, apiToken }?: TenantApiOptions) => <TData extends object, TVariables extends object>(fetcher: Fetcher<"Query" | "Mutation", TData, TVariables>, options?: {
    readonly variables?: TVariables;
    readonly headers?: Record<string, string>;
    readonly apiToken?: string | typeof LoginToken;
}) => Promise<TData>;

export declare const useTenantMutation: <TResult, TError extends string = never, TVariables extends object = {}>(fetcher: MutationFetcher<TenantMutation<TResult, TError>, TVariables>, { headers, apiToken }?: TenantApiOptions) => (variables: TVariables) => Promise<TenantMutationResponse<TResult, TError>>;

export declare const useTenantQueryLoader: <TVariables extends object, Result>(fetcher: (variables: TVariables) => Promise<Result>, variables: TVariables) => [TenantQueryLoaderState<Result>, TenantQueryLoaderMethods];

export declare const useUpdateProjectMemberForm: () => UpdateProjectMemberFormContextValue;

export declare const useUpdateProjectMemberMutation: ({ headers, apiToken }?: TenantApiOptions) => (variables: {
    readonly projectSlug: string;
    readonly identityId: string;
    readonly memberships: ReadonlyArray<TenantApi.MembershipInput>;
}) => Promise<TenantMutationResponse<unknown, TenantApi.UpdateProjectMemberErrorCode>>;

export { }
