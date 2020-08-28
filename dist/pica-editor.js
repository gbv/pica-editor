(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('codemirror'), require('vue')) :
  typeof define === 'function' && define.amd ? define(['codemirror', 'vue'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.PicaEditor = factory(global.CodeMirror, global.Vue));
}(this, (function (CodeMirror, vue) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var CodeMirror__default = /*#__PURE__*/_interopDefaultLegacy(CodeMirror);

  /**
   * PICA data processing module.
   */
  // parsing and serializing PICA+ <-> PICA/JSON
  const picaFieldIdentifier = ([tag, occ]) => tag + (occ ? "/" + (occ.length === 1 ? "0" + occ : occ) : "");
  const serializePicaField = field => picaFieldIdentifier(field) + " " + field.slice(2).map((s, i) => i % 2 ? s.replace(/\$/g, "$$$") : "$" + s).join("");
  const serializePica = pica => pica.map(serializePicaField).join("\n");
  const picaSubfieldPattern = /\$([A-Za-z0-9])((?:[^$]+|\$\$)+)/g;
  const picaLinePattern = new RegExp([/^(?<tag>[012][0-9][0-9][A-Z@])/, /(\/(?<occurrence>[0-9]{2,3}))?/, /\s*/, /(?<subfields>(\$([A-Za-z0-9])([^$]|\$\$)+)+)$/].map(r => r.source).join(""));
  const parsePica = text => text.split(/\n/).map(line => {
    const match = line.match(picaLinePattern);

    if (match) {
      const {
        tag,
        occurrence,
        subfields
      } = match.groups;
      const field = [tag, occurrence];

      for (let m of subfields.matchAll(picaSubfieldPattern)) {
        field.push(m[1], m[2].replace(/\$\$/g, "$"));
      }

      return field;
    }
  }).filter(Boolean); // PICA path expression

  class PicaPath {
    constructor(s) {
      const match = s.match(/^([012.][0-9.][0-9.][A-Z@.])(\[(([0-9.]{2})|([0-9]{2}-[0-9]{2}))\])?(\$([_A-Za-z0-9]+))?$/);
      if (!match) throw "Invalid PICA Path expression";
      this.tag = new RegExp("^" + match[1] + "$");
      this.occ = match[4] ? new RegExp("^" + match[4] + "$") : match[5] ? match[5].split("-") : null;
      this.sf = match[7] ? new RegExp("^[" + match[7] + "]$") : null;
    }

    get tagString() {
      return this.tag.source.substring(1, this.tag.source.length - 1);
    }

    get fieldIdentifier() {
      return this.tagString + (this.occ ? "/" + this.occurrenceString : "");
    }

    get startOccurrence() {
      return Array.isArray(this.occ) ? this.occ[0] : null;
    }

    get endOccurrence() {
      return Array.isArray(this.occ) ? this.occ[1] : null;
    }

    get occurrenceString() {
      if (Array.isArray(this.occ)) return this.occ.join("-");
      return this.occf ? this.occ.source.substr(1, this.occ.source.length - 1) : "";
    }

    get subfieldString() {
      const source = this.sf ? this.sf.source : "";
      return source.substring(2, source.length - 2);
    }

    get toString() {
      return this.fieldIdentifier + (this.sf ? "$" + this.subfieldString : "");
    }

    matchField(field) {
      const [tag, occ] = field;

      if (!this.tag.test(tag)) {
        return false;
      }

      if (tag[0] === "2" || !occ && !this.occ) {
        return true;
      }

      if (this.occ && !occ) return true;
      return Array.isArray(this.occ) ? this.occ[0] <= occ && this.occ[1] >= occ : this.occ.test(occ);
    }

    extractSubfields(field) {
      return field.filter((_, i) => i > 2 && i % 2 && (!this.sf || this.sf.test(field[i - 1])));
    }

    getFields(record) {
      return record.filter(f => this.matchField(f));
    }

    getValues(record) {
      return [].concat(...this.getFields(record).map(f => this.extractSubfields(f)));
    }

    getUniqueValues(record) {
      return [...new Set(this.getValues(record))];
    }

  } // filter record to fields listed in an array of PICA path expressions

  const filterPicaFields = (pica, exprs) => {
    exprs = Array.isArray(exprs) ? exprs : exprs.split(/\|/);
    exprs = exprs.map(e => e instanceof PicaPath ? e : new PicaPath(e));
    return pica.filter(field => exprs.some(e => e.matchField(field)));
  }; // get PPN of a record

  const PPN = new PicaPath("003@$0");
  const getPPN = record => PPN.getValues(record)[0];

  CodeMirror__default['default'].defineMode("pica", () => {
    // hard-coded parser with improved fallback after errors
    const TOKEN = {
      field: "variable-2",
      subfield: "comment",
      code: "keyword"
    };

    const startState = () => {
      return {
        next: "field",
        code: undefined
      };
    };

    return {
      startState,

      token(stream, state) {
        if (stream.sol()) {
          Object.assign(state, startState());
        }

        if (state.next === "field") {
          state.next = "subfield";

          if (stream.match(/[0-2][0-9]{2}[A-Z@](\/\d{2,3})?/)) {
            return TOKEN.field;
          }
        }

        if (state.next === "subfield") {
          if (state.code) {
            if (stream.eat(state.code)) {
              state.next = "code";
              return TOKEN.subfield;
            }
          } else {
            stream.eatSpace();

            if (stream.peek() === "$") {
              stream.next();
              state.code = "$";
              state.next = "code";
              return TOKEN.subfield;
            }
          }

          stream.eatWhile(/[^$]/);
          return "error";
        }

        if (state.next === "code") {
          state.next = "subfield-value";

          if (stream.next().match(/[a-zA-Z0-9]/)) {
            return TOKEN.code;
          } else {
            return "error";
          }
        }

        if (state.next === "subfield-value") {
          state.next = "subfield";

          while (stream.skipTo(state.code)) {
            if (stream.match(state.code + state.code)) {
              stream.next();
              stream.next();
            } else {
              break;
            }
          }

          if (stream.peek() !== state.code) {
            stream.skipToEnd();
          }

          return TOKEN.value;
        }

        stream.skipToEnd();
        return "error";
      }

    };
  });

  // CodeMirror, copyright (c) by Marijn Haverbeke and others
  var WRAP_CLASS = "CodeMirror-activeline";
  var BACK_CLASS = "CodeMirror-activeline-background";
  var GUTT_CLASS = "CodeMirror-activeline-gutter";
  CodeMirror__default['default'].defineOption("styleActiveLine", false, function (cm, val, old) {
    var prev = old == CodeMirror__default['default'].Init ? false : old;
    if (val == prev) return;

    if (prev) {
      cm.off("beforeSelectionChange", selectionChange);
      clearActiveLines(cm);
      delete cm.state.activeLines;
    }

    if (val) {
      cm.state.activeLines = [];
      updateActiveLines(cm, cm.listSelections());
      cm.on("beforeSelectionChange", selectionChange);
    }
  });

  function clearActiveLines(cm) {
    for (var i = 0; i < cm.state.activeLines.length; i++) {
      cm.removeLineClass(cm.state.activeLines[i], "wrap", WRAP_CLASS);
      cm.removeLineClass(cm.state.activeLines[i], "background", BACK_CLASS);
      cm.removeLineClass(cm.state.activeLines[i], "gutter", GUTT_CLASS);
    }
  }

  function sameArray(a, b) {
    if (a.length != b.length) return false;

    for (var i = 0; i < a.length; i++) if (a[i] != b[i]) return false;

    return true;
  }

  function updateActiveLines(cm, ranges) {
    var active = [];

    for (var i = 0; i < ranges.length; i++) {
      var range = ranges[i];
      var option = cm.getOption("styleActiveLine");
      if (typeof option == "object" && option.nonEmpty ? range.anchor.line != range.head.line : !range.empty()) continue;
      var line = cm.getLineHandleVisualStart(range.head.line);
      if (active[active.length - 1] != line) active.push(line);
    }

    if (sameArray(cm.state.activeLines, active)) return;
    cm.operation(function () {
      clearActiveLines(cm);

      for (var i = 0; i < active.length; i++) {
        cm.addLineClass(active[i], "wrap", WRAP_CLASS);
        cm.addLineClass(active[i], "background", BACK_CLASS);
        cm.addLineClass(active[i], "gutter", GUTT_CLASS);
      }

      cm.state.activeLines = active;
    });
  }

  function selectionChange(cm, sel) {
    updateActiveLines(cm, sel.ranges);
  }

  function getTextChildren(nodes) {
    return nodes.map(node => typeof node.children === "string" ? node.children : "").join("");
  } // CodeMirror instance for PICA Plain records


  var script = {
    props: {
      // unAPI base URL to load records from
      unapi: {
        type: String,
        default: null
      },
      // database key to load records from via unAPI
      dbkey: {
        type: String,
        default: null
      },
      // list of PICA Path expressions to filter loaded records
      fields: {
        type: Array,
        default: null
      },
      // base URL of catalog to link into
      picabase: {
        type: String,
        default: null
      },
      // whether PICA record can be edited
      editable: {
        type: Boolean,
        default: true
      },
      // Avram Schema
      schema: {
        type: Object,
        default: null
      }
    },
    emits: ["change"],
    data: function () {
      return {
        text: "",
        // record in PICA Plain
        record: [],
        // record in PICA/JSON
        inputPPN: null,
        // PPN in input field
        ppn: null,
        // PPN found in the record
        field: null,
        // field identifier at cursor
        subfield: null // subfield code at cursor

      };
    },

    created() {
      this.$watch("record", (record, oldRecord) => {
        // TODO: skip if record deep-equals oldRecord
        if (record === oldRecord) return;
        this.ppn = getPPN(record) || this.ppn;
        this.$emit("change", {
          record,
          ppn: this.ppn
        });
      }); // get record in PICA Plain from element content

      const slot = this.$slots.default;
      this.setText(slot ? getTextChildren(slot()) : "");
    },

    mounted: function () {
      const options = {
        mode: "pica",
        readOnly: !this.editable,
        styleActiveLine: true,
        lineWrapping: true
      };
      this.editor = CodeMirror__default['default'].fromTextArea(this.$refs.editor, options);
      this.editor.on("change", editor => this.setText(editor.getValue()));

      const updateCursor = () => Object.assign(this, this.picaAtCursor());

      this.editor.on("cursorActivity", updateCursor);
      updateCursor();
    },
    methods: {
      picaAtCursor() {
        const {
          line,
          ch
        } = this.editor.getCursor();
        const tokens = this.editor.getLineTokens(line);
        var field;
        var subfield;

        if (tokens.length && tokens[0].type === "variable-2") {
          field = tokens[0].string;

          for (const tok of tokens) {
            if (tok.type === "keyword") subfield = tok.string;
            if (tok.end > ch) break;
          }
        }

        return {
          field,
          subfield
        };
      },

      setText(text) {
        this.text = text;
        this.record = parsePica(text);
      },

      setRecord(record) {
        this.record = record;
        this.text = serializePica(record);

        if (this.editor) {
          // editor may not be mounted yet
          this.editor.setValue(this.text);
        }
      },

      loadRecord(ppn) {
        if (ppn) {
          this.ppn = ppn;
        }

        if (!this.ppn || !this.dbkey) {
          this.setRecord([]);
          return;
        }

        fetch(`${this.unapi}?format=picajson&id=${this.dbkey}:ppn:${this.ppn}`).then(response => response.ok ? response.json() : null).then(record => {
          if (record) {
            this.setRecord(this.fields ? filterPicaFields(record, this.fields) : record);
          }

          if (this.$router) {
            // Push changed ppn and dbkey to router
            this.$router.push({
              query: {
                ppn: this.ppn,
                dbkey: this.dbkey
              }
            });
          }
        });
      }

    }
  };

  const _withId = /*#__PURE__*/vue.withScopeId("data-v-5e36071d");

  vue.pushScopeId("data-v-5e36071d");
  const _hoisted_1 = { class: "panel" };
  const _hoisted_2 = {
    key: 0,
    style: {"float":"right"}
  };
  const _hoisted_3 = { key: 0 };
  const _hoisted_4 = { key: 1 };
  const _hoisted_5 = /*#__PURE__*/vue.createVNode("span", { style: {"font-variant":"small-caps"} }, "ppn ", -1 /* HOISTED */);
  const _hoisted_6 = { key: 1 };
  const _hoisted_7 = { class: "panel cm-s-default" };
  const _hoisted_8 = {
    key: 0,
    class: "cm-variable-2"
  };
  const _hoisted_9 = { key: 1 };
  const _hoisted_10 = /*#__PURE__*/vue.createVNode("code", { class: "cm-comment" }, "$", -1 /* HOISTED */);
  const _hoisted_11 = { class: "cm-keyword" };
  vue.popScopeId();

  const render = /*#__PURE__*/_withId(function render(_ctx, _cache, $props, $setup, $data, $options) {
    return (vue.openBlock(), vue.createBlock("form", {
      class: "PicaEditor",
      onSubmit: _cache[3] || (_cache[3] = vue.withModifiers($event => (_ctx.loadRecord(_ctx.inputPPN)), ["prevent"]))
    }, [
      vue.createVNode("div", _hoisted_1, [
        (_ctx.unapi && _ctx.dbkey)
          ? (vue.openBlock(), vue.createBlock("div", _hoisted_2, [
              vue.withDirectives(vue.createVNode("input", {
                "onUpdate:modelValue": _cache[1] || (_cache[1] = $event => (_ctx.inputPPN = $event)),
                type: "text",
                placeholder: "PPN"
              }, null, 512 /* NEED_PATCH */), [
                [vue.vModelText, _ctx.inputPPN]
              ]),
              vue.createVNode("button", {
                type: "submit",
                disabled: !_ctx.inputPPN
              }, " laden ", 8 /* PROPS */, ["disabled"])
            ]))
          : vue.createCommentVNode("v-if", true),
        vue.createVNode("ul", null, [
          (_ctx.picabase && _ctx.dbkey)
            ? (vue.openBlock(), vue.createBlock("li", _hoisted_3, [
                vue.createVNode("a", { href: _ctx.picabase }, vue.toDisplayString(_ctx.dbkey), 9 /* TEXT, PROPS */, ["href"])
              ]))
            : vue.createCommentVNode("v-if", true),
          (_ctx.ppn)
            ? (vue.openBlock(), vue.createBlock("li", _hoisted_4, [
                _hoisted_5,
                (_ctx.picabase)
                  ? (vue.openBlock(), vue.createBlock("a", {
                      key: 0,
                      href: _ctx.picabase+'PPNSET?PPN='+_ctx.ppn,
                      target: "opac"
                    }, [
                      vue.createVNode("code", null, vue.toDisplayString(_ctx.ppn), 1 /* TEXT */)
                    ], 8 /* PROPS */, ["href"]))
                  : (vue.openBlock(), vue.createBlock("span", _hoisted_6, [
                      vue.createVNode("code", null, vue.toDisplayString(_ctx.ppn), 1 /* TEXT */)
                    ]))
              ]))
            : vue.createCommentVNode("v-if", true)
        ])
      ]),
      vue.withDirectives(vue.createVNode("textarea", {
        ref: "editor",
        "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => (_ctx.text = $event))
      }, null, 512 /* NEED_PATCH */), [
        [vue.vModelText, _ctx.text]
      ]),
      vue.createVNode("div", _hoisted_7, [
        (_ctx.field)
          ? (vue.openBlock(), vue.createBlock("code", _hoisted_8, vue.toDisplayString(_ctx.field), 1 /* TEXT */))
          : vue.createCommentVNode("v-if", true),
        (_ctx.subfield)
          ? (vue.openBlock(), vue.createBlock("span", _hoisted_9, [
              _hoisted_10,
              vue.createVNode("code", _hoisted_11, vue.toDisplayString(_ctx.subfield), 1 /* TEXT */)
            ]))
          : vue.createCommentVNode("v-if", true)
      ])
    ], 32 /* HYDRATE_EVENTS */))
  });

  script.render = render;
  script.__scopeId = "data-v-5e36071d";
  script.__file = "src/PicaEditor.vue";

  return script;

})));
