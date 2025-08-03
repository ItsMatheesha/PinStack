import { Hono } from '@hono/hono'
import getRepo from "./gh/repo.ts";

const app = new Hono()
//set the port for the servers
const PORT = Number(Deno.env.get('PORT')) || 3000
//github repo api
getRepo(app)

app.notFound((c) => {
  return c.text('Invalid api request!')
})
//start the server
Deno.serve({ port: PORT }, app.fetch)