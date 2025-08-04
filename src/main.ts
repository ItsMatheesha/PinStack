import { Hono } from '@hono/hono'
import getGhRepo from "./gh/repo/repo.ts";
import getGhprofile from "./gh/profile/profile.ts";
import getSiteSs from "./site/site.ts";


const app = new Hono()
//set the port for the servers
const PORT = Number(Deno.env.get('PORT')) || 3000
//github repo api
getGhRepo(app)
//github profile api
getGhprofile(app)
//get site screenshot
getSiteSs(app)

app.notFound((c) => {
  return c.text('Invalid api request!')
})
//start the server
Deno.serve({ port: PORT }, app.fetch)