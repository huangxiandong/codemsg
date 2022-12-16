<template>
  <div class="chat-text-item">
    <div :style="{ fontSize: textFontSize + 'px'}" v-html="html"></div>
    <div class="chat-text-item-date">{{message.info.date}}</div>
  </div>
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
      let myHtml = '<p style="margin:2px">';
      if(text !== undefined) {
        do {
          let start = text.indexOf(":");
          // console.log("start", start);
          if(start == -1) {
            myHtml = `${myHtml}${text}`
            text = "";
          } else {
            let end = text.indexOf(":", start+1);
            // console.log("end", end);
            if(end == -1) {
              myHtml = `${myHtml}${text}`
              text = "";
            } else {
              let emoji = text.substring(start+1, end);
              // console.log("emoji", emoji);
              let style = `background-image: url('${uriRoot}/emoji/emoji_sprite.png');`
              let clazz = `emoji-item emoji-common emoji-${emoji}`;
              let eHtml = `<img alt="${emoji}" src="${uriRoot}/emoji/mask.png" class="${clazz}" style="${style}">`;
              let prefix =  text.substring(0, start);
              myHtml = `${myHtml}${prefix}${eHtml}`;
              text = text.substring(end+1);
            }
          }
        } while(text.length > 0)
      }
      myHtml = `${myHtml}</p>`
      // console.log("myHtml", myHtml);
      return myHtml;
    }
  }
}
</script>

<style lang="less" scoped>
@import "../styles/mymsg.less";

.chat-text-item {
  padding-left: 5px;
  padding-right: 5px;
}

.chat-text-item-text {
  font-size: 16px;
  max-width: 200px;
}

.chat-text-item-date {
  padding-top: 5px;
  font-size: 10px;
}
</style>