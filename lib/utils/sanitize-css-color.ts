const HEX_RE = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

const FUNC_RE = /^(?:rgb|hsl|oklch|lch|lab|oklab)a?\(\s*[0-9a-z%.,\s/\-+]+\)$/i

const NAMED_COLORS = new Set([
  "black","silver","gray","white","maroon","red","purple","fuchsia",
  "green","lime","olive","yellow","navy","blue","teal","aqua",
  "orange","aliceblue","antiquewhite","aquamarine","azure","beige",
  "bisque","blanchedalmond","blueviolet","brown","burlywood","cadetblue",
  "chartreuse","chocolate","coral","cornflowerblue","cornsilk","crimson",
  "cyan","darkblue","darkcyan","darkgoldenrod","darkgray","darkgreen",
  "darkgrey","darkkhaki","darkmagenta","darkolivegreen","darkorange",
  "darkorchid","darkred","darksalmon","darkseagreen","darkslateblue",
  "darkslategray","darkslategrey","darkturquoise","darkviolet","deeppink",
  "deepskyblue","dimgray","dimgrey","dodgerblue","firebrick","floralwhite",
  "forestgreen","gainsboro","ghostwhite","gold","goldenrod","greenyellow",
  "grey","honeydew","hotpink","indianred","indigo","ivory","khaki",
  "lavender","lavenderblush","lawngreen","lemonchiffon","lightblue",
  "lightcoral","lightcyan","lightgoldenrodyellow","lightgray","lightgreen",
  "lightgrey","lightpink","lightsalmon","lightseagreen","lightskyblue",
  "lightslategray","lightslategrey","lightsteelblue","lightyellow",
  "limegreen","linen","magenta","mediumaquamarine","mediumblue",
  "mediumorchid","mediumpurple","mediumseagreen","mediumslateblue",
  "mediumspringgreen","mediumturquoise","mediumvioletred","midnightblue",
  "mintcream","mistyrose","moccasin","navajowhite","oldlace","olivedrab",
  "orangered","orchid","palegoldenrod","palegreen","paleturquoise",
  "palevioletred","papayawhip","peachpuff","peru","pink","plum",
  "powderblue","rosybrown","royalblue","saddlebrown","salmon","sandybrown",
  "seagreen","seashell","sienna","skyblue","slateblue","slategray",
  "slategrey","snow","springgreen","steelblue","tan","thistle","tomato",
  "turquoise","violet","wheat","whitesmoke","yellowgreen",
])

/**
 * Validate that a value is a safe CSS color.
 * Returns the trimmed value if valid, or `null` if potentially malicious.
 */
export function sanitizeCssColor(value: string | null | undefined): string | null {
  if (!value) return null
  const v = value.trim()
  if (!v) return null
  if (HEX_RE.test(v)) return v
  if (FUNC_RE.test(v)) return v
  if (NAMED_COLORS.has(v.toLowerCase())) return v
  return null
}
