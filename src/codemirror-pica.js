// PICA mode and PICA linter for CodeMirror

import CodeMirror from "codemirror"
import { parsePicaLine, picaFieldSchedule, picaFieldIdentifier } from "pica-data"

const FIELD = "variable-2"
const SUBFIELD = "comment"
const CODE = "keyword"

// PICA mode via hard-coded parser with improved fallback after errors
CodeMirror.defineMode("pica", () => {

  const TOKEN = {
    field: FIELD,
    subfield: SUBFIELD,
    code: CODE,
  }

  const startState = () => {
    return {
      next: "field",
      code: undefined,
    }
  }

  return {
    startState,
    token(stream, state) {

      if (stream.sol()) {
        Object.assign(state, startState())
      }

      if (state.next === "field") {
        state.next = "subfield"
        if (stream.match(/[0-2][0-9]{2}[A-Z@](\/\d{2,3})?/)) {
          return TOKEN.field
        }
      }

      if (state.next === "subfield") {
        if (state.code) {
          if (stream.eat(state.code)) {
            state.next = "code"
            return TOKEN.subfield
          }
        } else {
          stream.eatSpace()
          if (stream.peek() === "$") {
            stream.next()
            state.code = "$"
            state.next = "code"
            return TOKEN.subfield
          }
        }

        stream.eatWhile(/[^$]/)
        return "error"
      }

      if (state.next === "code") {
        state.next = "subfield-value"
        if (stream.next().match(/[a-zA-Z0-9]/)) {
          return TOKEN.code
        } else {
          return "error"
        }
      }

      if (state.next === "subfield-value") {
        state.next = "subfield"

        while (stream.skipTo(state.code)) {
          if ( stream.match(state.code+state.code) ) {
            stream.next()
            stream.next()
          } else {
            break
          }
        }

        if (stream.peek() !== state.code) {
          stream.skipToEnd()
        }

        return TOKEN.value
      }

      stream.skipToEnd()
      return "error"
    },
  }
})

CodeMirror.registerHelper("lint", "pica", (text, options, editor) => {
  const schema = options.avram

  const found = []
  
  text.split(/\n/).forEach( (lineText, line) => {    
    if (lineText.match(/^\s*$/)) return
    const field = parsePicaLine(lineText)

    if (field) {    
      if (schema && schema.fields) {        
        const schedule = picaFieldSchedule(schema, field)
        if (!schedule) {
          const token = editor.getTokenAt({line, ch: 1})
          found.push({
            from: { line, ch: 0 },
            to: { line, ch: token.end },              
            message: "unbekanntes Feld " + picaFieldIdentifier(field),
            severity: "warning",
          })
        } else if (schedule.subfields) {
          const tokens = editor.getLineTokens(line)
          for (let i=2; i<tokens.length; i++) {
            if (tokens[i].type === CODE) {
              const code = tokens[i].string
              if (!(code in schedule.subfields)) {
                found.push({
                  from: { line, ch: tokens[i].start-1 },
                  to: { line, ch: tokens[i].end },
                  message: "unbekanntes Unterfeld $"+code,                    
                  severity: "warning",
                })
              }
            }
          }
        }
      }
    } else {
      // TODO: genauere Angabe z.B. Feld-ID, Unterfeld-Code, fehlender Wert...
      found.push({
        from: {line, ch:0 },
        message: "Syntaxfehler in PICA Plain",
      })
    }
  })

  return found
})

export default {}
