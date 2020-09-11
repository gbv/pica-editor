import CodeMirror from "codemirror"
import { parsePicaLine, picaFieldSchedule } from "./pica.js"

// PICA mode and PICA linter for CodeMirror

CodeMirror.defineMode("pica", () => {

  // hard-coded parser with improved fallback after errors

  const TOKEN = {
    field: "variable-2",
    subfield: "comment",
    code: "keyword",
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

CodeMirror.registerHelper("lint", "pica", (text, options) => {
  const schema = options.avram

  const found = []
  const lines = text.split(/\n/)
  for(var i=0; i<lines.length; i++) {
    const field = parsePicaLine(lines[i])
    if (field) {
      if (schema && schema.fields) {
        const schedule = picaFieldSchedule(schema, field)
        if (!schedule) {
          found.push({
            from: {line: i, ch:0},
            message:"unbekanntes Feld",
          })
        }
      } else { console.log("NO FIELDS") }
    } else {
      // TODO: ggf. genauere Analyse z.B. Feld-ID oder Unterfeld-Code
      found.push({
        from: {line: i, ch:0 },
        // to: {line: i, ch: lines[i].length-1 },
        message: "PICA Plain Syntaxfehler",
      })
    }
  }

  return found
})

export default {}
