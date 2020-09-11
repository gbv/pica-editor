import "./codemirror-pica.js"
import "./addon/show-hint.js"
import "./addon/show-hint.css"
import { picaFieldSchedule } from "./pica.js"

export function subfieldHint(editor, field, avram, current) {
  if (!field[0] || !avram) return
  const { subfields } = picaFieldSchedule(avram, field) || {}
  if (!subfields) return

  editor.showHint({
    hint: (editor) => {
      const { line, ch } = editor.getCursor()

      // just list all subfields. TODO: filter subfields
      const codes = Object.keys(subfields).sort()
      const list = codes.map(text => {
        return { text, displayText: text + " " + subfields[text].label }
      })

      const from = { line, ch }
      const to = { line, ch: ch+1 }
        
      const selectedHint = codes.findIndex(c => c === current)
      return selectedHint >= 0 ?{list, from, to, selectedHint}  : {list, from, to}      
    },
  })
}

// called when TAB is pressed
export function moveCursorNext(editor, avram) {
  const { line, ch } = editor.getCursor()
  const tokens = editor.getLineTokens(line)

  var i = tokens.findIndex(t => ch <= t.end)

  if (i === -1) {
    editor.setCursor(line+1, 0)
  } else {
    const { type, end } = tokens[i]
    const last = i == tokens.length-1

    // parse current line to PICA/JSON field
    const field = [null, null]
    if (tokens[0].type === "variable-2") {
      field[0] = tokens[0].string.split("/")[0] // tag
      field[1] = tokens[0].string.split("/")[1] // occ
    }
    for(let j=1; j<i; j++) {
      if (tokens[j].type === "keyword") {
        field.push(tokens[j].string)
        if (j<i) field.push(tokens[j+1].string)
      }
    }

    if (type === "variable-2" && last) {            // field without subfields
      editor.getDoc().replaceRange(" $",{line, end})
      subfieldHint(editor, field, avram)
    } else if (type === "comment" && ch == end) {   // cursor after '$'
      if (field) {
        const current = !last && tokens[i+1].type==="keyword" ? tokens[i+1].string : null
        subfieldHint(editor, field, avram, current)
      } else if (!last) {
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

// get field identifier and subfield code at the cursor
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

