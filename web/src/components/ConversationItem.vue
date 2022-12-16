<template>
  <div class="conversation-item" :class="{ active: isActive }" @click="handleClick">
    <n-badge :value="unread">
      <!-- <n-icon size="40" class="conversation-item-icon">
        <message-circle />
      </n-icon> -->
      <n-avatar round>{{capital}}</n-avatar>
    </n-badge>
    <!--
    <img class="conversation-item-img" :src="require('../assets/one.jpeg')">
    -->
    <div class="conversation-item-container">
      <div class="conversation-item-name">{{conversation.nickname}}</div>
      <div class="conversation-item-msg">{{conversation.address}}</div>
    </div>
    <div>
      <span :class="isOnline?'online-status':'offline-status'">{{status}}</span>
    </div>

  </div>
</template>

<script>
import { defineComponent } from "vue"
import { NBadge, NAvatar } from 'naive-ui'
import { MessageCircle } from '@vicons/tabler'

export default defineComponent({
  name: "ConversationItem",
  components: {
    NBadge,
    NAvatar,
    MessageCircle
  },
  props: {
    conversation: Object
  },
  data() {
    return {
      
    }
  },
  computed: {
    nls() {
      return this.$store.state.nls;
    },
    isActive() {
      if(this.$store.state.chatWith === undefined) {
        return false;
      } else {
        return (this.conversation.address === this.$store.state.chatWith.address)
                  && (this.conversation.port === this.$store.state.chatWith.port);
      }
    },
    capital() {
      return this.conversation.nickname.charAt(0).toUpperCase(); 
    },
    status() {
      let online = (this.conversation.online===undefined || !this.conversation.online) ? false : true;
      if(online) {        
        return this.nls.conversationStatusOnline;
      } else {
        return this.nls.conversationStatusOffline;
      }
    },
    isOnline() {
      console.log("isOnline", this.conversation);
      return (this.conversation.online===undefined || !this.conversation.online) ? false : true;
    },
    unread() {
      let address = this.conversation.address;
      let port = this.conversation.port;
      let findConversation = this.$store.state.conversations.find(item => {
        if(item.address === address && item.port === port) {
          return true;
        }
        return false;
      });

      let count = 0;
      if(findConversation !== undefined) {
        for(let msg of findConversation.messages) {
          if(!msg.info.read) {
            console.log("unread", msg);
            count++;
          }
        }
      }
      return count;
    }
  },
  methods: {
    handleClick() {
      this.$store.state.chatWith = this.conversation;   
      if(this.conversation !== undefined) {
        for(let msg of this.conversation.messages) {
          msg.info.read = true;
        }
      }
    }
  }
})
</script>

<style lang="less" scope>
@import "../styles/mymsg.less";

.conversation-item {
  width: 100%;
  max-height: 100px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding: 5px;
}

.vscode-light {
  .conversation-item {
    &.active {
      background-color: rgb(240, 240, 240);
    }
  }
}

.vscode-dark {
  .conversation-item {
    &.active {
      background-color: rgb(55, 55, 55);
    }
  }
}

.conversation-item-container {
  padding-left: 10px;
  flex: 1;
}

.conversation-item-img {
  max-width: 250px;
  min-width: 40px;
  width: 40px;
  margin: 10px 0;
  border: 1px solid #eee;
  overflow: hidden;
  border-radius: 50%;
  display: block;
}

.conversation-item-name {
  font-size: 14px;
}

.conversation-item-msg {
  font-size: 10px;
  color: gray;
}

.conversation-item-icon {
  color: lightblue;
}

.online-status {
  color: green;
}
.offline-status {
  color: gray;
  padding-right: 5px;
}

</style>