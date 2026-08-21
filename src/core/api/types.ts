export interface ApiMeta {
  correlationId: string;
  timestamp: string;
}

export interface ValidationDetail {
  field: string;
  constraint: string;
  message: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    correlationId: string;
    details?: ValidationDetail[];
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** Shape of every paginated list endpoint's `data` — see docs/API.md's "Pagination" section. */
export interface PaginatedList<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}