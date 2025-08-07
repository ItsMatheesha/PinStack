import { launch } from "jsr:@astral/astral";

export function topLang(languages: Record<string, number>): string {
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

//read the languages file for colours
const langs = JSON.parse(await Deno.readTextFile('./languages.json'))

export const getLangColor = (lang: string): string => {
  return langs[lang]?.color || '#ccc'
}

export function escapeXml(unsafe: string) {
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

export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}