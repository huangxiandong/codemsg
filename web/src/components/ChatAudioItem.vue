<template>
  <div class="chat-audio-item">
    <div>
      <audio controls="controls">
        <source :src="src" type="audio/mp3" />
      </audio>
    </div>
  </div>
</template>

<script>
export default {
  name: "ChatAudioItem",
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

.chat-audio-item {
  padding-left: 8px;
  padding-right: 8px;
}

.chat-audio-item-img {
  min-width: 50px;
  max-width: 300px;
}

.chat-audio-item-text {
  font-size: 16px;
  max-width: 200px;
}

.chat-audio-item-date {
  padding-top: 5px;
  font-size: 10px;
}
</style>