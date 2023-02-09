<template>
  <div class="chat-image-item">
    <div>
      <img class="chat-image-item-img" :src="src"/>
    </div>
  </div>
</template>

<script>
export default {
  name: "ChatImageItem",
  props: {
    file: {
      type: Object,
      required: true
    },
  },
  computed: {
    src() {
      let location = this.file.path;
      location = location.replace(/\\/g, "/");
      if(location.startsWith("/")) {
        location = location.substring(1);
      }
      console.log("web url", `${this.$store.state.webRoot}${location}`)
      return `${this.$store.state.webRoot}${location}`;
    }
  }
}
</script>

<style lang="less" scoped>
@import "../styles/mymsg.less";

.chat-image-item {
  padding-left: 8px;
  padding-right: 8px;
  min-width: 150px;
}

.chat-image-item-img {
  min-width: 50px;
  max-width: 300px;
}

.chat-image-item-text {
  font-size: 16px;
  max-width: 200px;
}

.chat-image-item-date {
  padding-top: 5px;
  font-size: 10px;
}
</style>