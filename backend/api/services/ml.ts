// backend/api/src/services/ml.ts
import { PythonShell } from 'python-shell';
import path from 'path';
import { MLPrediction } from '../types';

export class PythonMLService {
    private isModelTrained = false;

    async trainModel(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const options = {
                mode: 'text' as const,
                pythonPath: 'python',
                pythonOptions: ['-u'],
                scriptPath: path.join(__dirname, '../../../python'),
                args: ['--train-model']
            };

            PythonShell.run('analytics_engine.py', options)
                .then((results: string[]) => {
                    this.isModelTrained = true;
                    resolve(results || []);
                })
                .catch((err: Error) => {
                    reject(err);
                });
        });
    }

    async predictMatch(opponent: string, venue: string, competition: string): Promise<MLPrediction> {
        return new Promise((resolve, reject) => {
            const options = {
                mode: 'json' as const,
                pythonPath: 'python',
                pythonOptions: ['-u'],
                scriptPath: path.join(__dirname, '../../../python'),
                args: ['--predict', opponent, venue, competition]
            };

            PythonShell.run('analytics_engine.py', options)
                .then((results: any[]) => {
                    if (!results || results.length === 0) {
                        return reject(new Error('No prediction returned'));
                    }
                    resolve(results[0] as MLPrediction);
                })
                .catch((err: Error) => {
                    reject(err);
                });
        });
    }

    async updateData(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const options = {
                mode: 'text' as const,
                pythonPath: 'python',
                pythonOptions: ['-u'],
                scriptPath: path.join(__dirname, '../../../python'),
                args: ['--update-data']
            };

            PythonShell.run('analytics_engine.py', options)
                .then((results: string[]) => {
                    resolve(results || []);
                })
                .catch((err: Error) => {
                    reject(err);
                });
        });
    }

    get modelTrained(): boolean {
        return this.isModelTrained;
    }
}