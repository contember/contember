import { Context } from 'react';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import * as React_2 from 'react';
import { ReactNode } from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';

export declare const Toast: React_2.ForwardRefExoticComponent<Omit<ToastPrimitives.ToastProps & React_2.RefAttributes<HTMLLIElement> & {
    asChild?: boolean;
    children?: ReactNode;
    className?: string;
} & {
    variant?: "error" | "success" | "warning" | "info" | null | undefined;
}, "ref"> & React_2.RefAttributes<HTMLLIElement>>;

export declare const ToastAction: React_2.ForwardRefExoticComponent<Omit<ToastPrimitives.ToastActionProps & React_2.RefAttributes<HTMLButtonElement> & {
    asChild?: boolean;
    children?: ReactNode;
    className?: string;
}, "ref"> & React_2.RefAttributes<HTMLButtonElement>>;

export declare const ToastContent: ({ title, children, action, details }: {
    title?: ReactNode;
    children?: ReactNode;
    action?: ReactNode;
    details?: ReactNode;
}) => JSX_2.Element;

export declare interface ToastData {
    id: number;
    type: ToastType;
    content: ReactNode;
}

export declare const ToastDescription: React_2.ForwardRefExoticComponent<Omit<ToastPrimitives.ToastDescriptionProps & React_2.RefAttributes<HTMLDivElement> & {
    asChild?: boolean;
    children?: ReactNode;
    className?: string;
}, "ref"> & React_2.RefAttributes<HTMLDivElement>>;

export declare function Toaster({ children }: {
    children: ReactNode;
}): JSX_2.Element;

export declare interface ToasterMethods {
    showToast(content: ReactNode, options?: ToastOptions): ToastMethods;
    clear(): void;
}

export declare const ToasterMethodsContext: Context<ToasterMethods>;

export declare const ToasterProvider: ({ children }: {
    children: ReactNode;
}) => JSX_2.Element;

export declare interface ToasterState {
    toasts: ToastData[];
}

export declare const ToasterStateContext: Context<ToasterState>;

export declare interface ToastMethods {
    dismiss(): void;
    updateContent(content: ReactNode): void;
}

export declare interface ToastOptions {
    dismiss?: number;
    type?: ToastType;
}

export declare const ToastTitle: React_2.ForwardRefExoticComponent<Omit<ToastPrimitives.ToastTitleProps & React_2.RefAttributes<HTMLDivElement> & {
    asChild?: boolean;
    children?: ReactNode;
    className?: string;
}, "ref"> & React_2.RefAttributes<HTMLDivElement>>;

export declare type ToastType = 'success' | 'error' | 'warning' | 'info';

export declare const useShowToast: () => (content: ReactNode, options?: ToastOptions) => ToastMethods;

export declare const useToasterMethods: () => ToasterMethods;

export declare const useToasterState: () => ToasterState;

export declare const useToasts: () => ToastData[];

export { }
