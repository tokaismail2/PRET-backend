import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
    success: false;
    statusCode: number;
    message: string | string[];
    path: string;
    timestamp: string;
}

interface HttpExceptionResponse {
    message?: string | string[];
    error?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status = this.getHttpStatus(exception);
        const message = this.getErrorMessage(exception);

        const errorResponse: ErrorResponse = {
            success: false,
            statusCode: status,
            message,
            path: request.url,
            timestamp: new Date().toISOString(),
        };

        response.status(status).json(errorResponse);
    }

    private getHttpStatus(exception: unknown): number {
        return exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;
    }

    private getErrorMessage(exception: unknown): string | string[] {
        if (exception instanceof HttpException) {
            return this.extractHttpExceptionMessage(exception);
        }

        if (exception instanceof Error) {
            return exception.message;
        }

        return 'Internal server error';
    }

    private extractHttpExceptionMessage(
        exception: HttpException,
    ): string | string[] {
        const response = exception.getResponse();

        if (typeof response === 'string') {
            return response;
        }

        if (this.isHttpExceptionResponse(response)) {
            return response.message ?? response.error ?? 'Internal server error';
        }

        return 'Internal server error';
    }

    private isHttpExceptionResponse(
        response: unknown,
    ): response is HttpExceptionResponse {
        return (
            typeof response === 'object' &&
            response !== null &&
            ('message' in response || 'error' in response)
        );
    }
}