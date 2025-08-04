import { Hono } from "@hono/hono"
import { escapeXml, formatNumber } from "../../functions.ts";

const api = 'https://api.github.com/users/'
const key = Deno.env.get('GH_TOKEN')

export default function getGhprofile(app: Hono) {
    app.get('/gh/profile/:username', async (c) => {
        //get the usernam from the url
        const username = c.req.param('username')
        //get profile details from the github api
        const profile_req = await fetch(`${api}${username}`, {
            headers: {
                'User-Agent': 'PinStack - @ItsMatheesha[Github]',
                'Authorization': `Bearer ${key}`
            }
        })

        if (!profile_req.ok) {
            return c.text('Profile not found', 404)
        }
        const user = await profile_req.json()

        const svg_profile = (await Deno.readTextFile('./src/gh/profile/templates/profile.svg'))
            .replace(/\$\{avatar\}/g, escapeXml(user.avatar_url ?? ''))
            .replace(/\$\{name\}/g, escapeXml(user.name ?? 'Unknown'))
            .replace(/\$\{username\}/g, escapeXml(user.login ?? 'Unknown'))
            .replace(/\$\{followers\}/g, formatNumber(user.followers ?? 'NaN'))
            .replace(/\$\{location\}/g, escapeXml(user.location ?? 'Unknown'))
            .replace(/\$\{des\}/g, escapeXml(user.bio ?? 'Unknown'))

        return c.text(svg_profile, 200, {
            'Content-Type': 'image/svg+xml',
        })
    })
}