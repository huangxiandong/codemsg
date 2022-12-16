import { createRouter, createWebHashHistory } from "vue-router";
import Conversation from "../views/Conversation.vue";
import Contact from "../views/Contact.vue"
import Setting from "../views/Setting.vue"

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
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
