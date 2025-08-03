import { Hono } from '@hono/hono'
import { escapeXml, getLangColor, topLang } from "../../functions.ts";

const api = 'https://api.github.com/repos/'
const key = Deno.env.get('GH_TOKEN')

export default function getGhRepo(app: Hono) {
  app.get('/gh/repo/:owner/:repo', async (c) => {
    //get the owner and the repo name from the url
    const { owner, repo } = c.req.param()
    //get the theme parameter from the url
    const theme = c.req.query('theme') ?? 'dark'
    //set the text and bg color according to theme parameter
    let tcolor = ''
    let bgcolor = ''

    if (theme == 'dark') {
      tcolor = '#ffffff'
      bgcolor = '#0d1117'
    } else if (theme == 'light') {
      tcolor = '#000000'
      bgcolor = '#ffffff'
    }
    //get the repo details
    const repo_req = await fetch(`${api}${owner}/${repo}`, {
      headers: {
        'User-Agent': 'PinStack - @ItsMatheesha[Github]',
        'Authorization': `Bearer ${key}`
      }
    })
    //if the api request failed
    if (!repo_req.ok) {
      const error_svg = (await Deno.readTextFile('./src/error.svg'))
      return c.text(error_svg, 200, {
        'Content-Type': 'image/svg+xml',
      })
    }
    let top_lang
    let lang_color
    //get the language details of repo
    const lang_req = await fetch(`${api}${owner}/${repo}/languages`)
    //set language color for the top language
    if (!lang_req.ok) {
      lang_color = "#ccc"
    } else {
      top_lang = topLang(await lang_req.json())
      lang_color = getLangColor(top_lang)
    }

    const data = await repo_req.json()
    //extract repo description
    const des = escapeXml(data.description ?? '')
    //extract all topics of the repo & slice them to limit to only 5
    const topics = data.topics.slice(0, 4)

    const avatarReq = await fetch(data.owner.avatar_url)
    const avatarBuff = new Uint8Array(await avatarReq.arrayBuffer())
    const svg_top = (await Deno.readTextFile('./src/gh/repo/ghRepo-top.svg'))
      //avatar of the owner
      .replace(/\$\{owner_avatar\}/g, escapeXml(`data:image/png;base64,${btoa(String.fromCharCode(...avatarBuff))}`))
      //owners username
      .replace(/\$\{owner\}/g, owner)
      //repo name
      .replace(/\$\{repo\}/g, repo)
      //repo description
      .replace(/\$\{des\}/g, des.length > 50 ? des.slice(0, 57) + '...' : des)
      //set bg color of the svg
      .replace(/\$\{bgcolor\}/g, bgcolor)
      //set text color of the svg
      .replace(/\$\{tcolor\}/g, tcolor)
    let svg_topic = ''
    let pw = 0
    //add upto 4 topics to the svg
    for (let i = 0; i < topics.length; i++) {
      const temp = Math.floor(12 * 0.5)
      const tw = temp * topics[i].length

      svg_topic = svg_topic + (await Deno.readTextFile('./src/gh/repo/ghRepo-topic.svg'))
        //topic number
        .replace(/\$\{num\}/g, (i + 1).toString())
        //left margin of a topic
        .replace(/\$\{lm\}/g, pw.toString())
        //width of a topic
        .replace(/\$\{tw\}/g, (tw + 12).toString())
        //topic text
        .replace(/\$\{topic\}/g, topics[i])

      pw += tw + 20
    }
    const svg_btm = (await Deno.readTextFile('./src/gh/repo/ghRepo-btm.svg'))
      //color of the top language
      .replace(/\$\{lang_color\}/g, lang_color)
      //top language
      .replace(/\$\{top_lang\}/g, top_lang ?? 'Unknown')
    //return the generated svg
    return c.text(svg_top + svg_topic + svg_btm, 200, {
      'Content-Type': 'image/svg+xml',
    })
  })
}