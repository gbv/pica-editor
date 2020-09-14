<template>
  <div>
    <PicaEditor
      ref="editor"
      :unapi="unapi"
      :dbkey="dbkey"
      :picabase="picabase"
      :avram="avram"
      :filter="filter"
      :footer="true"
      @update:record="updateRecord"
      @update:ppn="updatePPN">
      <pre>
003@ $0355973081
010@ $ager
011@ $a2001
019@ $aXA-DE
021A $a@Zehn Jahre Pica in Niedersachsen und Deutschland$dSkizzen eines Erfolgs aus Anlass der 5. Verbundkonferenz des Gemeinsamen Bibliotheksverbundes der Länder Bremen, Hamburg, Mecklenburg-Vorpommern, Niedersachsen, Sachsen-Anhalt, Schleswig-Holstein und Thüringen, vom 11.-12. September, 2001 in Göttingen$h[Redaktion, Elmar Mittler]
029A $a@Gemeinsamer Bibliotheksverbund der Länder Bremen, Hamburg, Mecklenburg-Vorpommern, Niedersachsen, Sachsen-Anhalt, Schleswig-Holstein und Thüringen$bVerbundkonferenz$xGöttingen, Germany)
029F $a@Niedersächsische Staats- und Universitätsbibliothek Göttingen
033A $pGöttingen$nNiedersächsische Staats- und Universitätsbibliothek
034D $a181 p
034I $a21 cm
034M $aill
044A $aPICA Project$aCongresses
045A $aZ699.4.P23
045V $a10$a24,2
</pre>
    </PicaEditor>
    <div
      v-if="examples && examples.length"
      style="font-size: smaller; padding-top: 0.2em;">
      Beispiele:
      <ul class="inline">
        <li
          v-for="ex in examples"
          :key="ex">
          <a @click="loadRecord(ex)">{{ ex }}</a>
        </li>
      </ul>
    </div> 
  </div>
</template>

<script>
import PicaEditor from "../src/PicaEditor.vue"

const config = {
  unapi: "https://unapi.k10plus.de/",
  dbkey: "opac-de-627",
  picabase: "https://opac.k10plus.de/",
  avram: "https://format.k10plus.de/avram.pl",
  examples: [ "161165839X", "1673636357", "168675535X" ],
}

export default {
  components: { PicaEditor },
  data() {
    return {
      ...config,
      avram: {},
    } },
  mounted() {
    this.loadAvram("k10plus")
  },
  methods: {
    async loadAvram(profile) {
      const avram = await (fetch("https://format.k10plus.de/avram.pl?profile="+profile)
        .then(res => res.ok ? res.json() : {}))
      this.avram = avram
    },
    loadRecord(ppn) {
      // Use $nextTick to give dbkey the chance to propagate to PicaEditor
      this.$nextTick(() => {
        this.$refs.editor.loadRecord(ppn)
      })
    },
    updateRecord(record) {
      console.log(JSON.stringify(record))
    },
    updatePPN(ppn) {
      console.log(ppn)
    },
    filter(record) {
      return record
    },
  },
}
</script>
