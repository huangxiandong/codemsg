<template>
  <div class="contact-item" :class="{ active: isActive }" @click="handleClick" @dblclick="startChat" @mouseover="isHover=true" @mouseleave="isHover=false">
    <n-avatar round>{{capital}}</n-avatar>
    <!--
    <img class="conversation-item-img" :src="require('../assets/one.jpeg')">
    -->
    <div class="contact-item-container">
      <div :class="['contact-item-name', isMyself?'contact-item-myself':'']">{{contactName}}</div>
      <div class="contact-item-msg">{{contact.address}}</div>
    </div>
    <span v-show="!isHover" class="conversation-item-mode">{{contact.client}}</span>
    <n-icon size=20 class="refresh-icon" v-show="isHover" @click="handleRefresh"><Refresh /></n-icon>
    <n-icon size=20 :class="isFavorite?'favorite-icon':'not-favorite-icon'" v-show="isHover" @click="handleFavorite"><IosStar /></n-icon>
  </div>
</template>

<script>
import { defineComponent } from "vue"
import { NAvatar, NIcon } from 'naive-ui'
import { IosStar } from '@vicons/ionicons4'
import { Refresh } from '@vicons/tabler'
import ipc from "@/ipc";

export default defineComponent({
  name: "ContactItem",
  components: {
    NAvatar,
    NIcon,
    IosStar,
    Refresh
  },
  props: {
    contact: Object
  },
  data() {
    return {
      isHover: false
    }
  },
  computed: {
    nls() {
      return this.$store.state.nls;
    },
    isMyself() {
      return this.contact.myself !== undefined && this.contact.myself;
    },
    contactName() {
      if(this.isMyself) {
        return `${this.contact.nickname} ${this.nls.contactMyselfSurfix}`;
      }
      return this.contact.nickname;
    },
    isActive() {
      if(this.$store.state.selectContact === undefined) {
        return false;
      } else {
        return (this.contact.address === this.$store.state.selectContact.address)
                  && (this.contact.port === this.$store.state.selectContact.port);
      }
    },
    capital() {
      return this.contact.nickname.charAt(0).toUpperCase(); 
    },
    isFavorite() {
      return this.$store.state.favoriteContacts.indexOf(this.contact) != -1;
    }
  },
  methods: {
    handleClick() {
      this.$store.dispatch("selectContact", this.contact);
    },
    startChat() {
      this.$store.commit("selectContact", this.contact);
      this.$store.dispatch("addConversation");
      this.$store.dispatch("setCurrentView", "conversation");
      this.$router.push("/conversation");
    },
    handleFavorite() {
      console.log("handleFavorite");
      if(this.isFavorite) {
        this.$store.dispatch("removeFavorite", this.contact);
        ipc.removeFavorite(this.contact.address);
      } else {
        this.$store.dispatch("addFavorite", this.contact);
        ipc.addFavorite(this.contact.address);
      }
    },
    handleRefresh() {
      ipc.reentry({
        address: this.contact.address,
        port: this.contact.port
      });
    }
  }
})
</script>

<style lang="less" scope>
@import "../styles/mymsg.less";

.contact-item {
  box-sizing: border-box;
  width: 100%;
  // height: 40px;
  max-height: 100px;
  display: flex;
  align-items: center;
  padding: 5px;
}

.vscode-light {
  .contact-item {
    &.active {
      background-color: rgb(240, 240, 240);
    }
  }
}

.vscode-dark {
  .contact-item {
    &.active {
      background-color: rgb(55, 55, 55);
    }
  }
}

.contact-item-container {
  padding-left: 10px;
  flex: 1;
}

.contact-item-img {
  max-width: 250px;
  min-width: 40px;
  width: 40px;
  margin: 10px 0;
  border: 1px solid #eee;
  overflow: hidden;
  border-radius: 50%;
  display: block;
}

.contact-item-name {
  font-size: 14px;
  flex: 1;
}

.conversation-item-mode {
  font-size: 10px;
  color: gray;
}

.contact-item-myself {
  color: darkcyan;
}

.contact-item-msg {
  font-size: 10px;
  color: gray;
}

.contact-item-icon {
  color: lightblue;
}

.refresh-icon {
  color: gray;
  &:hover {
    color: green;
  }
}
.favorite-icon {
  color: green;
}

.not-favorite-icon {
  color: gray;
  &:hover {
    color: green;
  }
}

</style>