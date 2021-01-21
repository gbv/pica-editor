<template>
  <span>{{ database.title ? database.title.de : database.dbkey }}</span>
</template>

<script>
export default {
  props: {
    database: {
      type: Object,
      required: true,
    },
  },
}
</script>
