import PythonShell from 'python-shell';
import path from 'path';
import { MLPrediction } from '../types';

export class PythonMLService {
    private isModelTrained = false;

    async trainModel(): Promise<string[]> {
        const options = {
            mode: 'text' as const,
            pythonPath: 'python',
            pythonOptions: ['-u'],
            scriptPath: path.join(__dirname, '../python'),
            args: ['--train-model']
        };

        return new Promise((resolve, reject) => {
            PythonShell.run('analytics_engine.py', options, (err, results) => {
                if (err) return reject(err);
                this.isModelTrained = true;
                resolve(results || []);
            });
        });
    }

    async predictMatch(opponent: string, venue: string, competition: string): Promise<MLPrediction> {
        const options = {
            mode: 'json' as const,
            pythonPath: 'python',
            pythonOptions: ['-u'],
            scriptPath: path.join(__dirname, '../python'),
            args: ['--predict', opponent, venue, competition]
        };

        return new Promise((resolve, reject) => {
            PythonShell.run('analytics_engine.py', options, (err, results: any) => {
                if (err || !results || results.length === 0) {
                    return reject(err || new Error('No prediction returned'));
                }
                resolve(results[0] as MLPrediction);
            });
        });
    }

    async updateData(): Promise<string[]> {
        const options = {
            mode: 'text' as const,
            pythonPath: 'python',
            pythonOptions: ['-u'],
            scriptPath: path.join(__dirname, '../python'),
            args: ['--update-data']
        };

        return new Promise((resolve, reject) => {
            PythonShell.run('analytics_engine.py', options, (err, results) => {
                if (err) return reject(err);
                resolve(results || []);
            });
        });
    }

    get modelTrained(): boolean {
        return this.isModelTrained;
    }
}
