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
      let myHtml = "";
      text = text.replaceAll(/\r\n/g, "<br>")
      text = text.replaceAll(/\n/g, "<br>")
      text = text.replaceAll(/\r/g, "<br>")
      if(text !== undefined) {
        do {
          let start = text.indexOf("http://");
          if(start == -1) {
            myHtml = `${myHtml}${text}`
            text = "";
          } else {
            let end = text.indexOf(" ", start+1);
            if(end == -1) {
              end = text.length;              
            }
            let prefix = text.substring(0, start);
            let url = text.substring(start, end);
            myHtml = `${myHtml}${prefix}<a href="${url}">${url}</a>`
            text = text.substring(end);
          }
        } while(text.length > 0)
      }
      text = myHtml;
      myHtml = "";
      if(text !== undefined) {
        do {
          let start = text.indexOf("https://");
          if(start == -1) {
            myHtml = `${myHtml}${text}`
            text = "";
          } else {
            let end = text.indexOf(" ", start+1);
            if(end == -1) {
              end = text.length;              
            }
            let prefix = text.substring(0, start);
            let url = text.substring(start, end);
            myHtml = `${myHtml}${prefix}<a href="${url}">${url}</a>`
            text = text.substring(end);
          }
        } while(text.length > 0)
      }

      myHtml = `<p style="margin:2px">${myHtml}</p>`
      console.log("chat text", myHtml);
      return myHtml;
    }
  }
}
</script>

<style lang="less" scoped>
@import "../styles/mymsg.less";

.chat-text-item {
  user-select: text;
  max-width: 400px;
  word-break: break-word;
}

</style>