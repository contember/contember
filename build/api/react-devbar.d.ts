import { JSX as JSX_2 } from 'react/jsx-runtime';
import { PropsWithChildren } from 'react';
import { ReactElement } from 'react';
import { ReactNode } from 'react';

export declare const createErrorHandler: (renderer: ErrorReactRenderer) => TryRun;

export declare const DevBar: ({ breakpoint, children, }: PropsWithChildren<{
    breakpoint?: number;
}>) => JSX_2.Element;

export declare function DevError(props: DevErrorProps): JSX_2.Element;

export declare function DevErrorBadge({ errorCount, onOpen, onClear }: DevErrorBadgeProps): JSX_2.Element;

export declare interface DevErrorBadgeProps {
    onOpen: () => void;
    onClear: () => void;
    errorCount: number;
}

declare interface DevErrorInnerProps {
    error: ProcessedError;
    level?: number;
}

export declare function DevErrorList({ currentError, currentErrorIndex, currentErrorSource, errorCount, onClose, onNext, onPrevious, onClear, }: DevErrorListProps): JSX_2.Element;

export declare interface DevErrorListProps {
    currentError: ProcessedError;
    currentErrorSource: string;
    currentErrorIndex: number;
    errorCount: number;
    onPrevious: () => void;
    onNext: () => void;
    onClose: () => void;
    onClear: () => void;
}

export declare interface DevErrorProps extends DevErrorInnerProps {
    source: string;
}

export declare const DevPanel: ({ heading, icon, children, preview }: DevPanelProps) => JSX_2.Element;

declare interface DevPanelProps {
    icon: ReactNode;
    heading: ReactNode;
    children: ReactNode;
    preview?: ReactNode;
}

export declare type ErrorReactRenderer = (domElement: Element, reactElement: ReactElement, onRecoverableError: (e: any) => void) => void;

export declare type ErrorType = Error | unknown;

export declare interface ParsedStackFrame {
    filename: string;
    thirdParty: boolean;
    line?: number;
    callee?: string;
    sourceCodeLines?: string[];
}

export declare type ParsedStackTrace = ParsedStackFrame[];

export declare const parseStacktrace: (e: Error) => Promise<{
    filename: string;
    line: number | undefined;
    callee: string;
    thirdParty: boolean;
    sourceCodeLines: string[] | undefined;
}[] | undefined>;

export declare interface ProcessedError {
    error: ErrorType;
    parsedStackStrace?: ParsedStackTrace;
    cause?: ProcessedError;
}

declare type TryRun = <T>(cb: (onRecoverableError: (e: any) => void) => T | Promise<T>) => void;

export declare const useProcessedError: (e: ErrorType) => ProcessedError;

export { }
