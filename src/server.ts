import express, { Request, Response } from 'express';
import { getDependencyGraph } from './parser';
import * as path from 'path';

const app = express();
const port = 3001;
let graphDataCache = {};

// Middleware to serve the static webview files
app.use(express.static(path.join(__dirname, '../webview/dist')));

// API endpoint to serve the dependency graph data
app.get('/api/graph', async (_req: Request, res: Response) => {
    try {
        const data = await getDependencyGraph();
        graphDataCache = data;
        res.json(data);
    } catch (e) {
        console.error("Error generating graph data:", e);
        res.status(500).json({ error: 'Failed to generate graph data.' });
    }
});

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});

// A route to get the latest data.
app.get('/api/latest-graph', (_req: Request, res: Response) => {
    res.json(graphDataCache);
});