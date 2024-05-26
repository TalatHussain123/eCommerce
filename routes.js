// routes.js
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

export async function loadRoutes(app) {
    const baseurl = '/api/eshop';
    const routesDir = join(dirname(fileURLToPath(import.meta.url)), 'backend', 'routes');

    // Read all files in the routes directory
    const files = await fs.promises.readdir(routesDir);

    // Load and define routes from each route module
    for (const file of files) {
        if (file.endsWith('.js')) {
            const routeModule = await import(join(routesDir, file));
            if (routeModule.defineRoutes) {
                routeModule.defineRoutes(app, baseurl);
            }
        }
    }
}
