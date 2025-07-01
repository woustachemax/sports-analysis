import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/database';
import { ApiResponse, UpcomingMatch, Competition } from '../types';

export const createAnalyticsRoutes = (dbService: DatabaseService) => {
    const router = Router();

    router.get('/dashboard', async (req: Request, res: Response) => {
        try {
            const [latestMatch, formStats, seasonStats] = await Promise.all([
                dbService.getLatestMatch(),
                dbService.getFormStats(10),
                dbService.getSeasonStats()
            ]);

            const upcomingMatches: UpcomingMatch[] = [
                {
                    id: 1,
                    opponent: 'Al Hilal',
                    venue: 'Away',
                    competition: 'FIFA Club World Cup',
                    date: '2025-07-08',
                    time: '20:00'
                },
                {
                    id: 2,
                    opponent: 'Pachuca',
                    venue: 'Home',
                    competition: 'FIFA Club World Cup',
                    date: '2025-07-12',
                    time: '22:00'
                },
                {
                    id: 3,
                    opponent: 'Manchester City',
                    venue: 'Neutral',
                    competition: 'FIFA Club World Cup',
                    date: '2025-07-16',
                    time: '21:00'
                }
            ];

            const response: ApiResponse = {
                success: true,
                data: {
                    latestMatch,
                    formStats,
                    seasonStats,
                    upcomingMatches,
                    lastUpdated: new Date().toISOString()
                }
            };
            res.json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                error: 'Failed to fetch dashboard data',
                details: error instanceof Error ? error.message : 'Unknown error'
            };
            res.status(500).json(response);
        }
    });

    router.get('/competitions', async (req: Request, res: Response) => {
        try {
            const competitions = await dbService.getCompetitions();
            const response: ApiResponse<Competition[]> = {
                success: true,
                data: competitions
            };
            res.json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                error: 'Failed to fetch competitions',
                details: error instanceof Error ? error.message : 'Unknown error'
            };
            res.status(500).json(response);
        }
    });

    return router;
};
