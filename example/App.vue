<template>
  <div>
    <hr>
    <PicaLoader
      v-model:ppn="loadingPPN" 
      v-model:dbkey="loadingDbkey" 
      v-model:record="loadingRecord"
      v-model:error="loadingError"
      :databases="[{dbkey:'opac-de-627',title:{de:'foo'}}]" 
      :unapi="unapi" />
    <hr>
    <PicaEditor
      ref="editor"
      :ppn="ppn"
      :dbkey="dbkey"
      :unapi="unapi"
      :xpn="'online'"
      :databases="databases"
      :avram="avram"
      :footer="true"
      @update:record="updateRecord">
      <pre>
003@ $0355973081
010@ $ager
001U $0utf8
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
          <a @click="ppn = ex">{{ ex }}</a>
        </li>
      </ul>
    </div> 
  </div>
</template>

<script>
import PicaEditor from "../src/PicaEditor.vue"
import PicaLoader from "../src/PicaLoader.vue"

const config = {
  unapi: "https://unapi.k10plus.de/",
  avramApi: "https://format.k10plus.de/avram.pl",
  profile: "k10plus",
  examples: [ "161165839X", "1673636357", "168675535X", "088389065" ],
  ppn: undefined,
  dbkey: undefined,
  databases: [
    {
      dbkey: "opac-de-627",
      picabase: "https://opac.k10plus.de/",
      title: { de: "K10plus-Verbundkatalog" },
    },
    {
      dbkey: "oevk",
      picabase: "https://oevk.k10plus.de/",
      title: { de: "Verbundkatalog Öffentlicher Bibliotheken" },
    },
  ],
}

export default {
  components: { PicaEditor, PicaLoader },
  data() {
    return {
      ...config,
      avram: `${config.avramApi}?profile=${config.profile}`,
      loadingError: null,
      loadingRecord: [],
      loadingDbkey: null,
      loadingPPN: "355973081",
    } 
  },
  methods: {
    updateRecord() {
      console.log("updateRecord")
    },
  },
}
</script>
