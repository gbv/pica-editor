import "./codemirror-pica.js"

export function moveCursorNext(editor) {
  const { line, ch } = editor.getCursor()
  const tokens = editor.getLineTokens(line)

  var i = tokens.findIndex(t => ch <= t.end)

  if (i === -1) {
    editor.setCursor(line+1, 0)
  } else {
    const { type, end } = tokens[i]
    const last = i == tokens.length-1
    if (type === "variable-2" && last) {            // only field on the line
      editor.getDoc().replaceRange(" $",{line, end})
      // TODO: suggestSubfield
    } else if (type === "comment" && ch == end) {   // cursor after '$'
      // TODO: suggestSubfield
      if (!last) {
        editor.setCursor(line, tokens[i+1].end)
      }
    } else if (last && ch >= end) {                 // end of line
      editor.setCursor(line+1, 0)
    } else if (last) {    
      editor.setCursor(line, end)
    } else {
      i++
      while (i<tokens.length-1 && tokens[i].type !== "keyword" && tokens[i].type !== "error") {
        i++
      }
      if (tokens[i].type === "error") {
        editor.setCursor(line, tokens[i].start)
      } else {
        editor.setCursor(line, tokens[i].end)
      }
    }
  }
}

export function picaAtCursor(editor) {
  const { line, ch } = editor.getCursor()
  const tokens = editor.getLineTokens(line)
  var field
  var subfield
  if (tokens.length && tokens[0].type === "variable-2") {
    field = tokens[0].string.replace(/^\s+/,"")
    for(const tok of tokens) {
      if (tok.type === "keyword") subfield = tok.string
      if (tok.end>ch) break
    }
  }
  return { field, subfield } 
}
