import { ErrorAccessor } from '@contember/interface';
import { ReactNode } from 'react';

/**
 * `useErrorFormatter` is a custom hook that formats an array of errors into readable messages.
 * It processes validation and execution errors and returns corresponding user-friendly messages.
 *
 * #### Returns
 * A memoized callback function that takes an array of `ErrorAccessor.Error` and returns an array of `ReactNode` messages.
 *
 * #### Example: Formatting validation and execution errors
 * ```tsx
 * const formatErrors = useErrorFormatter();
 *
 * const errors = [
 *   { type: 'validation', code: 'fieldRequired', message: 'This field is required' },
 *   { type: 'execution', code: 'UniqueConstraintViolation' }
 * ];
 *
 * const formattedErrors = formatErrors(errors);
 *
 * return <>{formattedErrors.map((error, i) => <div key={i}>{error}</div>)}</>;
 * ```
 */
export declare const useErrorFormatter: () => (errors: ErrorAccessor.Error[]) => ReactNode[];

export { }
