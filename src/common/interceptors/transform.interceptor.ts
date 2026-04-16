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
    [key: string]: any;
}

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, Response<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<Response<T>> {
        return next.handle().pipe(
            // map((data) => {
            //     if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
            //         return data;
            //     }

            //     let message = 'Operation successful';
            //     if (data && typeof data === 'object' && 'message' in data) {
            //         message = data.message;
            //     }

            //     const { message: _, ...rest } = data ?? {};

            //     return {
            //         success: true,
            //         message,
            //         ...rest,
            //     };
            // }),

            map((data) => {
                if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
                    return data;
                }

                let message = 'Operation successful';
                let resultData = data;
                // ✅ زود السطر ده بس
                let pagination;

                if (data && typeof data === 'object' && 'message' in data) {
                    message = data.message;

                    if ('data' in data) {
                        resultData = data.data;
                    } else {
                        const { message: _, ...rest } = data;
                        resultData = rest;
                    }

                    // ✅ لو فيه pagination اسحبه
                    if ('pagination' in data) {
                        pagination = data.pagination;
                    }
                }

                return {
                    success: true,
                    message,
                    data: resultData,
                    // ✅ هيتحط بس لو موجود
                    ...(pagination && { pagination }),
                };
            }),
        );
    }
}