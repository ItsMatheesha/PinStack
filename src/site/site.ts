import { Hono } from '@hono/hono'
import { takeScreenshot } from '../functions.ts'

export default function getSiteSs(app: Hono) {
    app.get('/ss', async (c) => {
        const url = c.req.query('url')

        if (!url) {
            return c.text('Missing url parameter', 400);
        }

        let ss
        try {
            ss = await takeScreenshot(url);
        } catch (e) {
            return c.text(`Error taking screenshot: ${e}`, 500);
        }

        const svgString = typeof ss === 'string' ? ss : new TextDecoder().decode(new Uint8Array(ss));
        return c.text(svgString, 200, {
            'Content-Type': 'image/svg+xml',
        })
    })
}