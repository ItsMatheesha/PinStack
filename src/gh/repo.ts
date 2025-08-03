import { Hono } from '@hono/hono'

const api = 'https://api.github.com/repos/'
const key = Deno.env.get('GH_TOKEN')

//read the languages file for colours
const langs = JSON.parse(await Deno.readTextFile('./languages.json'))

function topLang(languages: Record<string, number>): string {
  let topLang = 'Unknown'
  let maxBytes = 0

  for (const lang in languages) {
    if (languages[lang] > maxBytes) {
      maxBytes = languages[lang]
      topLang = lang
    }
  }

  return topLang
}

const getLangColor = (lang: string): string => {
  return langs[lang]?.color || '#ccc'
}

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '\'': return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}

export default function getRepo(app: Hono) {
  app.get('/gh/repo/:owner/:repo', async (c) => {
    const { owner, repo } = c.req.param()
    const repo_req = await fetch(`${api}${owner}/${repo}`, {
      headers: {
        'User-Agent': 'ghpin - @ItsMatheesha[Github]',
        'Authorization': `Bearer ${key}`
      }
    })
    //if the api request failed
    if (!repo_req.ok) {
      const error_svg = (await Deno.readTextFile('./notFound.svg'))
      return c.text(error_svg, 200, {
      'Content-Type': 'image/svg+xml',
    })
    }
    let top_lang
    let lang_color
    const lang_req = await fetch(`${api}${owner}/${repo}/languages`)

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
    const svg_top = (await Deno.readTextFile('./template-top.svg'))
      //avatar of the owner
      .replace(/\$\{owner_avatar\}/g, escapeXml(`data:image/png;base64,${btoa(String.fromCharCode(...avatarBuff))}`))
      //owners username
      .replace(/\$\{owner\}/g, owner)
      //repo name
      .replace(/\$\{repo\}/g, repo)
      //repo description
      .replace(/\$\{des\}/g, des.length > 50 ? des.slice(0, 57) + '...' : des)
    let svg_topic = ''
    let pw = 0
    //add upto 5 topics 
    for (let i = 0; i < topics.length; i++) {
      const temp = Math.floor(12 * 0.5)
      const tw = temp * topics[i].length

      svg_topic = svg_topic + (await Deno.readTextFile('./template-topic.svg'))
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
    const svg_btm = (await Deno.readTextFile('./template-bottom.svg'))
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