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

.chat-image-item {
  padding-left: 5px;
  padding-right: 5px;
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