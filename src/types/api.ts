export type ApiErrorCode =
    | "UNAUTHORIZED"
    | "MISSING_KEY"
    | "INVALID_KEY"
    | "PLAN_REQUIRED"
    | "VALIDATION_ERROR"
    | "NOT_FOUND"
    | "INTERNAL_ERROR"
    | "RATE_LIMIT_EXCEEDED"
    | "NO_JOBS_PROVIDED"
    | "EMPTY_JOB_DESCRIPTION";

export type ApiError = {
    error: {
        code: ApiErrorCode;
        message: string;
        issues?: unknown;
    };
};

export type PaginatedResponse<T> = {
    data: T[];
    meta: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
};

export type BaseResponse<T> = {
    data: T;
};
