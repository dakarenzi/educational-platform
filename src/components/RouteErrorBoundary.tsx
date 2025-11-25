import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { useEffect } from 'react';
import { errorReporter } from '@/lib/errorReporter';
import { ErrorFallback } from './ErrorFallback';
export function RouteErrorBoundary() {
  // Call useRouteError unconditionally at the top level of the component.
  const error = useRouteError();
  useEffect(() => {
    if (error) {
      try {
        let errorMessage = 'Unknown route error';
        let errorStack = '';
        if (isRouteErrorResponse(error)) {
          errorMessage = `Route Error ${error.status}: ${error.statusText}`;
          if (error.data) {
            try {
              errorMessage += ` - ${JSON.stringify(error.data)}`;
            } catch {
              errorMessage += ' - (Unserializable data)';
            }
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
          errorStack = error.stack || '';
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else {
          try {
            errorMessage = JSON.stringify(error);
          } catch {
            errorMessage = 'Unserializable route error object';
          }
        }
        errorReporter.report({
          message: errorMessage,
          stack: errorStack,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          source: 'react-router',
          error: error,
          level: "error",
        });
      } catch (reportingError) {
        console.error("Error while reporting the route error:", reportingError);
      }
    }
  }, [error]);
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <ErrorFallback
          title="Page Not Found"
          message="Sorry, the page you are looking for does not exist."
          statusMessage="404 Error"
        />
      );
    }
    return (
      <ErrorFallback
        title={`${error.status} ${error.statusText}`}
        message="Sorry, an error occurred while loading this page."
        error={error.data ? { message: JSON.stringify(error.data, null, 2) } : error}
        statusMessage="Navigation error detected"
      />
    );
  }
  return (
    <ErrorFallback
      title="Unexpected Error"
      message="An unexpected error occurred while loading this page."
      error={error}
      statusMessage="Routing error detected"
    />
  );
}