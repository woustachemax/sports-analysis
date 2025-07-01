import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err);
    const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    };
    res.status(500).json(response);
};

export const notFoundHandler = (req: Request, res: Response) => {
    const response: ApiResponse = {
        success: false,
        error: 'Endpoint not found'
    };
    res.status(404).json(response);
};
