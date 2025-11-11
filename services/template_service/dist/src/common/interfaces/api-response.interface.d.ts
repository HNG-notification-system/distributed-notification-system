import { PaginationMeta } from './pagination-meta.interface';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message: string;
    meta?: PaginationMeta;
}
