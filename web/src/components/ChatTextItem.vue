<template>
  <div class="chat-text-item" :style="{ fontSize: textFontSize + 'px'}" v-html="html"></div>
</template>

<script>
export default {
  name: "ChatTextItem",
  props: {
    message: {
      type: Object,
      required: true
    },
  },
  computed: {
    textFontSize() {
      return this.$store.state.textFontSize;
    },
    html() {
      const uriRoot = this.$store.state.uriRoot;
      let text = this.message.extra.text;
      // console.log("chat text", text);
      let myHtml = text;
      
      let text_http = "";
      let pos = 0;
      if(myHtml !== undefined) {
        do {
          let start = myHtml.indexOf("http://");
          if(start == -1) {
            text_http = myHtml;
            pos = myHtml.length;
          } else {
            let end = myHtml.indexOf(" ", start+1);
            if(end == -1) {
              end = myHtml.length;
            }
            pos = end;
            let url = myHtml.substring(start, end);
            text_http = `${text_http}<a href="${url}">${url}</a>`
          }
        } while(pos < text.length)
      }
      myHtml = text_http;
      myHtml = `<p style="margin:2px">${myHtml}</p>`
      // console.log("myHtml", myHtml);
      return myHtml;
    }
  }
}
</script>

<style lang="less" scoped>
@import "../styles/mymsg.less";

.chat-text-item {
  user-select: text;
}

</style>