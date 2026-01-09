import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
    success: boolean;
    message: string;
    data: T;
}

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, Response<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<Response<T>> {
        return next.handle().pipe(
            map((data) => {
                // If the data already has the format, return it as is
                // This is for backward compatibility or if some services still return this format
                if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
                    return data;
                }

                // Handle case where data might have a message and the rest is data
                let message = 'Operation successful';
                let resultData = data;

                if (data && typeof data === 'object' && 'message' in data) {
                    message = data.message;
                    // If there's a 'data' field, use it, otherwise use the rest of the object without the message field
                    if ('data' in data) {
                        resultData = data.data;
                    } else {
                        const { message: _, ...rest } = data;
                        resultData = rest;
                    }
                }

                return {
                    success: true,
                    message,
                    data: resultData,
                };
            }),
        );
    }
}
