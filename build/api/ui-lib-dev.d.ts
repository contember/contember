import { JSX as JSX_2 } from 'react/jsx-runtime';
import { ReactNode } from 'react';

/**
 * Props for the {@link Comment} component.
 */
export declare interface CommentProps {
    /**
     * The comment content or message
     */
    children: ReactNode;
}

/**
 * `LoginWithEmail` component handles user authentication using email.
 * It integrates with session token management to facilitate authentication.
 *
 * #### Example: Basic Usage
 * ```tsx
 * <LoginWithEmail />
 * ```
 */
export declare const LoginWithEmail: () => JSX_2.Element;

/**
 * Props {@link CommentProps}.
 *
 * `Todo` is a development-only helper component for marking TODOs in the UI.
 * It displays a highlighted message when in development mode (`import.meta.env.DEV`).
 *
 * #### Example: Basic Usage
 * ```tsx
 * <Todo>Implement authentication logic</Todo>
 * ```
 */
export declare const Todo: ({ children }: CommentProps) => JSX_2.Element | null;

export { }
