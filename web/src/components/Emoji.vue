<template>
  <img :src="imgSrc" :alt="text" class="emoji emoji-common" 
    :class="['emoji-'+text]" :style="style" @click="emojiClick">
</template>
<script>
export default {
  data() {
    return {};
  },
  components: {},
  props: ["text", "isInput"],
  computed: {
    imgSrc() {
      return `${this.$store.state.uriRoot}/emoji/mask.png`
    },
    style() {
      return `background-image: url('${this.$store.state.uriRoot}/emoji/emoji_sprite.png');`
    }
  },
  methods: {
    emojiClick() {
      this.$emit("onClick", this.text);
    }
  }
};
</script>

<style lang="less" scoped>
.emoji {
  zoom: 0.5;
  margin: 4px;
  &:hover {
    cursor: pointer;
    background-color: lightgray;
  }
}
</style>