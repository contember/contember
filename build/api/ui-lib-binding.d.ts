import { ErrorPersistResult } from '@contember/interface';
import type { FC } from 'react';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import type { ReactElement } from 'react';
import { ReactNode } from 'react';
import { RoutingLinkTarget } from '@contember/interface';
import { SuccessfulPersistResult } from '@contember/interface';

/**
 * Props {@link BindingProps}.
 *
 * `Binding` component - Core data management wrapper for Contember applications
 *
 * #### Subcomponents
 * - {@link NavigationGuardDialog}: Prevents accidental navigation with unsaved changes
 *
 * #### Example
 * ```tsx
 * <Binding>
 *   <EntitySubTree entity="Project(id: $id)">
 *     <ArticleForm />
 *   </EntitySubTree>
 * </Binding>
 * ```
 */
export declare const Binding: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element;

/**
 * Props for the {@link Binding} component.
 */
export declare type BindingProps = {
    /**
     * The content to be wrapped by the Binding component.
     */
    children: ReactNode;
};

/**
 * Props {@link DeleteEntityDialogProps}.
 *
 * `DeleteEntityDialog` component - Confirmation dialog for entity deletion
 *
 * Provides a user-friendly confirmation flow before deleting entities while handling persistence and redirects
 *
 * #### Example: Basic usage
 * ```tsx
 * <DeleteEntityDialog
 *   trigger={<Button>Delete User</Button>}
 * />
 * ```
 *
 * #### Example: With delayed persistence
 * ```tsx
 * <DeleteEntityDialog
 *   immediatePersist={false}
 *   trigger={<Button>Mark for Deletion</Button>}
 * />
 * ```
 *
 * #### Example: With redirect
 * ```tsx
 * <DeleteEntityDialog
 *   onSuccessRedirectTo="users"
 *   trigger={<Button variant="destructive">Delete</Button>}
 * />
 * ```
 */
export declare const DeleteEntityDialog: FC<DeleteEntityDialogProps>;

/**
 * Props for {@link DeleteEntityDialog} component.
 */
export declare type DeleteEntityDialogProps = {
    /** Element that opens the dialog */
    trigger: ReactElement;
    /** Controls if deletion happens immediately (default: true) */
    immediatePersist?: boolean;
    /** Routing target after successful deletion */
    onSuccessRedirectTo?: RoutingLinkTarget;
};

/**
 * Props {@link IdentityLoaderProps}.
 *
 * `IdentityLoader` component manages the loading state of user identity and renders appropriate UI based on state.
 *
 * This component handles different identity states, such as loading, failure, and successful authentication,
 * ensuring a smooth user experience.
 *
 * #### Example: Wrapping an authenticated component
 * ```tsx
 * <IdentityLoader>
 *   <Dashboard />
 * </IdentityLoader>
 * ```
 */
export declare const IdentityLoader: ({ children }: IdentityLoaderProps) => JSX_2.Element;

/**
 * Props for {@link IdentityLoader} component.
 */
export declare type IdentityLoaderProps = {
    /**
     * The content to be wrapped by the IdentityLoader component
     */
    children: ReactNode;
};

/**
 * `NavigationGuardDialog` component prompts users with a confirmation dialog when attempting to navigate away
 * from a page with unsaved changes.
 *
 * This component integrates with {@link useBlockNavigationOnDirtyState} to prevent accidental data loss.
 * The user can choose to save, discard, or cancel the navigation attempt.
 *
 * #### Example: Basic Usage
 * ```tsx
 * <NavigationGuardDialog />
 * ```
 */
export declare const NavigationGuardDialog: () => JSX_2.Element;

/**
 * `PersistButton` is a button component that triggers a persistence action (saves unsaved data).
 *
 * #### Used hooks
 * - {@link usePersistSuccessHandler}: Handles success feedback after persistence
 *
 * #### Example: Basic usage
 * ```tsx
 * <PersistButton />
 * ```
 *
 * #### Example: Custom label
 * ```tsx
 * <PersistButton label="Save Article" />
 * ```
 */
export declare const PersistButton: ({ label }: PersistButtonProps) => JSX_2.Element;

/**
 * Props for the {@link PersistButton} component.
 */
export declare type PersistButtonProps = {
    /**
     * Custom button text (default: dictionary.persist.persistButton)
     */
    label?: ReactNode;
};

/**
 * A hook `usePersistErrorHandler` that handles persistence errors by showing appropriate toast notifications.
 *
 * #### Returns
 * Callback function to handle persistence errors
 *
 * #### Example
 * ```tsx
 * const handleError = usePersistErrorHandler()
 *
 * try {
 *   await persist()
 * } catch (error) {
 *   handleError(error)
 * }
 * ```
 */
export declare const usePersistErrorHandler: () => (result: ErrorPersistResult) => void;

/**
 * A hook `usePersistFeedbackHandlers` that provides handlers for persistence feedback. Currently returns success handler. Used in {@link usePersistWithFeedback}.
 *
 * #### Returns
 * Object containing persistence feedback handlers
 *
 * #### Example
 * ```tsx
 * const { onPersistSuccess } = usePersistFeedbackHandlers()
 *
 * persistData().then(onPersistSuccess)
 * ```
 */
export declare const usePersistFeedbackHandlers: () => {
    onPersistSuccess: (result: SuccessfulPersistResult) => void;
};

/**
 * A hook `usePersistSuccessHandler` that handles successful persistence by showing appropriate toast notifications.
 *
 * ### Returns
 * Callback function to handle successful persistence
 *
 * #### Example
 * ```tsx
 * const handleSuccess = usePersistSuccessHandler()
 *
 * persistData().then(result => handleSuccess(result))
 * ```
 */
export declare const usePersistSuccessHandler: () => (result: SuccessfulPersistResult) => void;

/**
 * A hook `usePersistWithFeedback` that combines persistence with automatic feedback notifications. Triggers data persistence and shows success/error toasts.
 *
 * #### Returns
 * A callback function that triggers persistence with feedback
 *
 * #### Example
 * ```tsx
 * const SaveButton = () => {
 *   const persistWithFeedback = usePersistWithFeedback()
 *
 *   return (
 *     <button onClick={() => persistWithFeedback()}>
 *       Save changes
 *     </button>
 *   )
 * }
 * ```
 */
export declare const usePersistWithFeedback: () => () => Promise<void | null>;

export { }
