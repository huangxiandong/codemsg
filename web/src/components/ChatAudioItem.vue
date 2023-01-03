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
    message: {
      type: Object,
      required: true
    },
  },
  computed: {
    src() {
      let location = this.message.extra.location;
      location = location.replace(/\\/g, "/");
      let name = this.message.extra.files[0].name;
      console.log("location++", location);
      console.log("name++", name);
      return `https://file%2B.vscode-resource.vscode-cdn.net/${location}`;
    }
  }
}
</script>

<style lang="less" scoped>
@import "../styles/mymsg.less";

.chat-audio-item {
  padding-left: 5px;
  padding-right: 5px;
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