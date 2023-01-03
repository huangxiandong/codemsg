import { createStore } from "vuex";
import enUS from "@/lang/locale.enUS"
import zhCN from "@/lang/locale.zhCN"

export default createStore({
  state: {
    theme: 2,
    mode: 'FeiQ',
    nickname: '',
    group: '',
    filelocation: '',
    currentView: 'conversation',
    contacts: [],
    conversations: [],
    chatWith: undefined,
    selectContact: undefined,
    count: 0,
    networkList: [],
    useVscodeMsg: false,
    favoriteList: [],
    contactFilter: "",
    favoriteContacts:[],
    notifier: undefined,
    hisdays: 1,
    encryption: true,
    textFontSize: 16,
    locale: "enUS",
    nls: enUS,
    asideWidth: 300,
    chatInputHeight: 200,
    uriRoot: '',
    ip: '',
    ipList: []
  },

  mutations: {
    setTheme: (state, theme) => {
      state.theme = theme;
    },
    setMode: (state, mode) => {
      state.mode = mode;
    },
    setNickname: (state, nickname) => {
      state.nickname = nickname;
    },
    setGroup: (state, group) => {
      state.group = group;
    },
    setFilelocation: (state, filelocation) => {
      state.filelocation = filelocation;
    },
    addContact: (state, contact) => {
      let findContact = undefined;
      for(let item of state.contacts) {
        if(item.address === contact.address) {
          findContact = item;
          break;
        }
      }
      if(findContact !== undefined) {
        findContact.nickname = contact.nickname;
        findContact.group = contact.group;
      } else {
        state.contacts.push(contact);
        let index = state.favoriteList.indexOf(contact.address);
        if(index != -1) {
          state.favoriteContacts.push(contact);
        }
      }
    },
    removeContact: (state, contact) => {
      let index = -1;
      for(let i=0; i<state.contacts.length; i++) {
        let item = state.contacts[i];
        if(item.address === contact.address) {
          index = i;
          break;
        }
      }
      if(index != -1) {
        state.contacts.splice(index, 1);
      }

      let findConversation = state.conversations.find(item => {
        if(item.address === contact.address) {
          return true;
        }
        return false;
      });
      if(findConversation !== undefined) {
        findConversation.online = false;
      }
    },
    refreshContact: (state, contact) => {
      let findContact = undefined;
      for(let item of state.contacts) {
        if(item.address === contact.address) {
          findContact = item;
          break;
        }
      }
      if(findContact !== undefined) {
        findContact.nickname = contact.nickname;
        findContact.group = contact.group;
        findContact.feiq = contact.feiq;
      }
    },
    clearContact: (state) => {
      state.contacts.splice(0, state.contacts.length);
      state.favoriteContacts.splice(0, state.favoriteContacts.length);
      console.log("clearContact", state.contacts);
      for(let conversation of state.conversations) {
        conversation.online = false;
      }
    },
    selectContact: (state, contact) => {
      state.selectContact = contact;
    },
    addFavorite: (state, contact) => {
      state.favoriteContacts.push(contact);
      state.favoriteList.push(contact.address);
    },
    removeFavorite: (state, contact) => {
      let index = state.favoriteContacts.indexOf(contact);
      if(index != -1) {
        state.favoriteContacts.splice(index, 1);
      }
      let pos = state.favoriteList.index(contact.address);
      if(pos != -1) {
        state.favoriteList.splice(pos, 1);
      }
    },
    setChatWith: (state, user) => {
      state.chatWith = user;
    },
    addConversation: (state) => {
      let contact = state.selectContact;
      let address = contact.address;
      let port = contact.port;
      let nickname = (contact.nickname === undefined || contact.nickname === "") ? contact.user : contact.nickname;
      let group = (contact.group === undefined || contact.group === "") ? "其他" : contact.group;
      let feiq = contact.feiq;
      let findConversation = state.conversations.find(item => {
        if(item.address === address && item.port === port) {
          return true;
        }
        return false;
      });
      if(findConversation === undefined) {
        let newConversation = {
          feiq,
          online: true,
          nickname: nickname,
          group: group,
          address: address,
          port: port,
          messages: []
        }
        state.conversations.push(newConversation);
        console.log("conversations", state.conversations);
        state.chatWith = newConversation;
      } else {
        state.chatWith = findConversation;
      }
    },
    refreshConversation: (state, contact) => {
      console.log("refreshConversation", state.conversations);
      let findConversation = state.conversations.find(item => {
        if(item.address === contact.address) {
          return true;
        }
        return false;
      });
      if(findConversation !== undefined) {
        console.log("findConversation", findConversation);
        findConversation.nickname = contact.nickname;
        findConversation.group = contact.group;
        findConversation.feiq = contact.feiq;
        findConversation.online = true;
      }
    },
    addMessage: (state, obj) => {
      let pos = obj.pos;
      let message = obj.message;
      console.log("message", message);
      let address = message.remote.address;
      let port = message.remote.port;
      let findConversation = state.conversations.find(item => {
        if(item.address === address && item.port === port) {
          return true;
        }
        return false;
      });
      if(findConversation === undefined) {
        let findContact = state.contacts.find(item => {
          if(item.address === address && item.port === port) {
            return true;
          }
          return false;
        });
        let feiq = false;
        let packet = message.packet;
        if(packet.version !== undefined && packet.version.indexOf("#") != -1) {
          feiq = true;
        }
        let online = false;
        let nickname = message.remote.nickname;
        let group = message.remote.group;
        if(findContact !== undefined) {
          nickname = (findContact.nickname === undefined || findContact.nickname === "") ? findContact.user : findContact.nickname;
          group = (findContact.group === undefined || findContact.group === "") ? "其他" : findContact.group;
          online = true;
        }
        let newConversation = {
          feiq,
          online,
          nickname: nickname,
          group,
          address: address,
          port: port,
          messages: []
        };
        if(pos != -1) {
          newConversation.messages.splice(0, 0, message);
        } else {
          newConversation.messages.push(message);
        }
        state.conversations.push(newConversation);
        if(state.chatWith === undefined) {
          state.chatWith = state.conversations[0];
        }
      } else {
        if(pos != -1) {
          findConversation.messages.splice(0, 0, message);
        } else {
          findConversation.messages.push(message);
        }
        if(findConversation.nickname === "unknown") {
          findConversation.nickname = message.remote.nickname;
          findConversation.group = message.remote.group;
        }
      }
    },
    updateFileMessage: (state, message) => {
      console.log("updateFileMessage", message);
      if(state.chatWith !== undefined) {
        for(let item of state.chatWith.messages) {
          if(message.messageId === item.messageId) {
            for(let field of message.extra.fields) {
              item.extra[field.name] = field.value;
            }
            break;
          }
        }
      }
    },

    updateFileMessage2: (state, message) => {
      console.log("updateFileMessage2", message);
      console.log("conversations", state.conversations);
      let address = message.address;
      let port = message.port;
      let findConversation = state.conversations.find(item => {
        if(item.address === address && item.port === port) {
          return true;
        }
        return false;
      });
      if(findConversation !== undefined) {
        console.log("findConversation", findConversation);
        for(let item of findConversation.messages) {
          if(message.fileId === item.packet.packetId) {
            console.log("findMessage", item);
            for(let field of message.fields) {
              item.extra[field.name] = field.value;
            }
            break;
          }
        }
      }
    },
    updateSelectFiles: (state, data) => {
      console.log("updateSelectFiles", data);
      let files = data.files;
      let fileIds = data.fileIds;
      for(let file of files) {
        let accept = false;
        for(let fileId of fileIds) {
          if(file.fileId === fileId) {
            accept = true;
            break;
          }
        }
        file.accept = accept;
      }
    },

    fileUpdate: (state, message) => {
      console.log("fileUpdate", message);
      let address = message.remote.address;
      let port = message.remote.port;
      let findConversation = state.conversations.find(item => {
        if(item.address === address && item.port === port) {
          return true;
        }
        return false;
      });
      if(findConversation !== undefined) {
        console.log("findConversation", findConversation);
        for(let item of findConversation.messages) {
          if(message.packet.packetId === item.packet.packetId) {
            console.log("findMessage", item);
            for(let field of message.extra.fields) {
              item.extra[field.name] = field.value;
            }
            if(item.extra.status == 3 && message.extra.fileId !== undefined) {
              let fileId = message.extra.fileId;
              for(let file of item.extra.files) {
                if(file.fileId === fileId) {
                  file.accept = true;
                  break;
                }
              }
            }
            break;
          }
        }
      }    
    },

    increaseMessage: (state) => {
      state.count++;
    },
    setCurrentView: (state, view) => {
      state.currentView = view;
    },
    setNetworkList: (state, networkList) => {
      console.log("state set networkList", networkList);
      state.networkList = networkList;
    },
    setFavoriteList: (state, favoriteList) => {
      console.log("state set favoriteList", favoriteList);
      state.favoriteList = favoriteList;
    },
    setContactFilter: (state, filter) => {
      state.contactFilter = filter;
    },
    setNotifier: (state, notifier) => {
      console.log("state setNotifier", notifier);
      state.notifier = notifier;
    },
    setUseVscodeMsg: (state, useVscodeMsg) => {
      state.useVscodeMsg = useVscodeMsg;
    },
    setHisdays: (state, hisdays) => {
      console.log("state setHisdays", hisdays);
      state.hisdays = hisdays;
    },
    setTextFontSize: (state, size) => {
      state.textFontSize = size;
    },
    setLocale: (state, locale) => {
      state.locale = locale;
      if(locale === "zhCN") {
        state.nls = zhCN;
      } else {
        state.nls = enUS;
      }
    },
    setEncryption: (state, encryption) => {
      state.encryption = encryption;
    },
    setAsideWidth: (state, width) => {
      state.asideWidth = width;
    },
    setChatInputHeight: (state, height) => {
      state.chatInputHeight = height;
    },
    setUriRoot: (state, uriRoot) => {
      state.uriRoot = uriRoot;
    },
    setIp: (state, ip) => {
      state.ip = ip;
    },
    setIpList: (state, ips) => {
      state.ipList = ips;
    }
  },
  actions: {
    setTheme: ({ commit }, theme) => {
      commit("setTheme", theme);
    },
    setMode: ({ commit }, mode) => {
      commit("setMode", mode);
    },
    setNickname: ({ commit }, nickname) => {
      commit("setNickname", nickname);
    },
    setGroup: ({ commit }, group) => {
      commit("setGroup", group);
    },
    setFilelocation: ({ commit }, filelocation) => {
      commit("setFilelocation", filelocation);
    },
    addContact: ({ commit }, contact) => {
      commit("addContact", contact);
      commit("refreshConversation", contact);
    },
    removeContact: ({ commit }, contact) => {
      commit("removeContact", contact);
    },
    refreshContact: ({ commit }, contact) => {
      commit("refreshContact", contact);
      commit("refreshConversation", contact);
    },
    clearContact: ({ commit }) => {
      commit("clearContact");
    },
    selectContact: ({ commit }, contact) => {
      commit("selectContact", contact);
    },
    addFavorite: ({ commit }, contact) => {
      commit("addFavorite", contact);
    },
    removeFavorite: ({ commit }, contact) => {
      commit("removeFavorite", contact);
    },
    setChatWith: ({ commit }, user) => {
      commit("setChatWith", user);
    },
    addConversation: ({ commit }, message) => {
      commit("addConversation", message);
    },
    addMessage: ({ commit }, message) => {
      commit("addMessage", message);
    },
    updateFileMessage: ({ commit }, message) => {
      commit("updateFileMessage", message);
    },
    updateFileMessage2: ({ commit }, message) => {
      commit("updateFileMessage2", message);
    },
    updateSelectFiles: ({ commit }, message) => {
      commit("updateSelectFiles", message);
    },
    fileUpdate: ({ commit }, message) => {
      commit("fileUpdate", message);
    },
    increaseMessage: ({commit}) => {
      commit("increaseMessage");
    },
    setCurrentView: ({commit}, view) => {
      commit("setCurrentView", view);
    },
    setNetworkList: ({commit}, networkList) => {
      commit("setNetworkList", networkList);
    },
    setFavoriteList: ({commit}, favoriteList) => {
      commit("setFavoriteList", favoriteList);
    },
    setContactFilter: ({commit}, filter) => {
      commit("setContactFilter", filter);
    },
    setNotifier: ({commit}, notifier) => {
      commit("setNotifier", notifier);
    },
    setUseVscodeMsg: ({commit}, useVscodeMsg) => {
      commit("setUseVscodeMsg", useVscodeMsg);
    },
    setHisdays: ({commit}, hisdays) => {
      commit("setHisdays", hisdays);
    },
    setTextFontSize: ({commit}, size) => {
      commit("setTextFontSize", size);
    },
    setLocale: ({commit}, locale) => {
      commit("setLocale", locale);
    },
    setEncryption: ({commit}, encryption) => {
      commit("setEncryption", encryption);
    },
    setAsideWidth: ({commit}, width) => {
      commit("setAsideWidth", width);
    },
    setChatInputHeight: ({commit}, height) => {
      commit("setChatInputHeight", height);
    },
    setUriRoot: ({commit}, uriRoot) => {
      commit("setUriRoot", uriRoot);
    },
    setIp: ({commit}, ip) => {
      commit("setIp", ip);
    },
    setIpList: ({commit}, ips) => {
      commit("setIpList", ips);
    }
  },
  modules: {},
});
