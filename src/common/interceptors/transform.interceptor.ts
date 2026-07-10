import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Shape of a paginated response from a service.
 */
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Checks whether the given value is a paginated response object
 * (has both a `data` array and a `meta` metadata object).
 */
function isPaginatedResponse(value: unknown): value is PaginatedResponse<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    Array.isArray((value as any).data) &&
    'meta' in value &&
    typeof (value as any).meta === 'object'
  );
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, any>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const statusCode = context.switchToHttp().getResponse().statusCode;
    const timestamp = new Date().toISOString();

    return next.handle().pipe(
      map((responseBody) => {
        // Paginated responses: flatten `data` and `meta` to top level
        if (isPaginatedResponse(responseBody)) {
          return {
            statusCode,
            data: responseBody.data,
            meta: responseBody.meta,
            timestamp,
          };
        }

        // Standard responses: wrap in `data` key
        return {
          statusCode,
          data: responseBody,
          timestamp,
        };
      }),
    );
  }
}
