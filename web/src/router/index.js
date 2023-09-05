import { createRouter, createWebHashHistory } from "vue-router";
import Conversation from "../views/Conversation.vue";
import Contact from "../views/Contact.vue"
import Setting from "../views/Setting.vue"
import Video from "../views/Video.vue"

const routes = [
  {
    path: "/",
    redirect: "/conversation"
  },
  {
    path: "/conversation",
    name: "conversation",
    component: Conversation
  },
  {
    path: "/contact",
    name: "Contact",
    component: Contact,    
  },
  {
    path: "/setting",
    name: "Setting",
    component: Setting,    
  },
  {
    path: "/video",
    name: "video",
    component: Video,    
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
