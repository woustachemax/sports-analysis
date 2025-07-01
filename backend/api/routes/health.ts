import { Router, Request, Response } from 'express';
import { ApiResponse } from '../types';
import { PythonMLService } from '../services/ml';

export const createHealthRoutes = (mlService: PythonMLService) => {
    const router = Router();

    router.get('/', (req: Request, res: Response) => {
        const response: ApiResponse = {
            success: true,
            data: {
                status: 'operational', 
                timestamp: new Date().toISOString(),
                version: '2.0.0',
                modelTrained: mlService.modelTrained
            }
        };
        res.json(response);
    });

    return router;
};
