import { JSX as JSX_2 } from 'react/jsx-runtime';
import { ReactNode } from 'react';
import { RoutingLinkTarget } from '@contember/interface';

/**
 * Props {@link BackButtonProps}.
 *
 * `BackButton` is a navigation button that returns the user to the previous page using the browser's history API.
 * It provides a default label but allows customization via the `label` prop or `children`.
 *
 * #### Example: Basic usage
 * ```tsx
 * <BackButton />
 * ```
 *
 * #### Example: Custom label
 * ```tsx
 * <BackButton label="Return to list" />
 * ```
 *
 * #### Example: Custom content
 * ```tsx
 * <BackButton>
 *   <CustomIcon />
 *   <span>Go Back</span>
 * </BackButton>
 * ```
 */
export declare const BackButton: ({ label, children }: BackButtonProps) => JSX_2.Element;

/**
 * Props {@link BackButtonLabelProps}.
 *
 * `BackButtonLabel` is a presentational component that renders a back arrow icon
 * alongside a label. Typically used inside `BackButton` for consistent styling.
 *
 * #### Example: Basic usage
 * ```tsx
 * <BackButtonLabel />
 * ```
 *
 * #### Example: Custom label
 * ```tsx
 * <BackButtonLabel label="Go Back" />
 * ```
 */
export declare const BackButtonLabel: ({ label }: BackButtonLabelProps) => JSX_2.Element;

/**
 * Props for {@link BackButtonLabel} component.
 */
export declare type BackButtonLabelProps = {
    /**
     * Optional custom button text (default: dictionary.backButton.back)
     * */
    label?: string;
};

/**
 * Props for {@link BackButton} component.
 */
export declare type BackButtonProps = {
    /**
     * Optional custom button content replaces label with default icon
     * */
    children?: ReactNode;
} & BackButtonLabelProps;

/**
 * `LinkBackButton` is a navigational button that provides a back navigation link.
 * It wraps the link inside a `Slots.Back` container and renders an `AnchorButton`.
 *
 * #### Comparison
 * - **{@link BackButton}**: Uses browser history.back()
 *
 * #### Example: Basic usage (keeps default icon)
 * ```tsx
 * <LinkBackButton to="articles" label="Back to Articles" />
 * ```
 *
 * #### Example: With icon only
 * ```tsx
 * <LinkBackButton to="dashboard">
 *   <ArrowLeftIcon />
 * </LinkBackButton>
 * ```
 *
 * #### Example: With custom icon and label
 * ```tsx
 * <LinkBackButton to="dashboard">
 *   <ArrowLeftIcon /> Dashboard
 * </LinkBackButton>
 * ```
 */
export declare const LinkBackButton: ({ children, label, to }: LinkBackButtonProps) => JSX_2.Element;

/**
 * Props for the {@link LinkBackButton} component.
 */
export declare type LinkBackButtonProps = {
    /**
     * Optional custom button content replaces label with default icon
     */
    children?: ReactNode;
    /**
     * Button label content
     */
    label: ReactNode;
    /**
     * Required routing target for navigation
     */
    to: RoutingLinkTarget;
};

export { }
