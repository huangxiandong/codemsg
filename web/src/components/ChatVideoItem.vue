<template>
  <div class="chat-video-item">
    <div>
      <video width="320" height="240" controls="controls">
        <source :src="src" :type="type" />
      </video>
    </div>
  </div>
</template>

<script>
export default {
  name: "ChatVideoItem",
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
    },
    type() {
      let name = this.file.name;
      let index = name.lastIndexOf(".");
      if(index != -1) {
        let surfix = name.substring(index+1);
        if(surfix === "ogv") {
          return "video/ogg";  
        }
      }
      return "video/mp4";      
    }
  }
}
</script>

<style lang="less" scoped>
@import "../styles/mymsg.less";

.chat-video-item {
  padding-left: 8px;
  padding-right: 8px;
}

.chat-video-item-img {
  min-width: 50px;
  max-width: 300px;
}

.chat-video-item-text {
  font-size: 16px;
  max-width: 200px;
}

.chat-video-item-date {
  padding-top: 5px;
  font-size: 10px;
}
</style>