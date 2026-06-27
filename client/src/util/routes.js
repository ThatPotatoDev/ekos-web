import Align from '@/components/pages/Align.vue'
import Capture from '@/components/pages/Capture.vue'
import Focus from '@/components/pages/Focus.vue'
import Guide from '@/components/pages/guide/Guide.vue'
import LiveStack from '@/components/pages/LiveStack.vue'
import Logs from '@/components/pages/Logs.vue'
import Main from '@/components/pages/Main.vue'
import Mount from '@/components/pages/mount/Mount.vue'
import ControlPanel from '@/components/pages/ControlPanel.vue'
import Settings from '@/components/pages/settings/Settings.vue'
import Stellarium from '@/components/stellarium/Stellarium.vue'

const routes = [{
  name: "Main",
  path: "/",
  icon: "mdi-home",
  component: Main,
},{
  name: "Sky",
  path: "/sky",
  icon: "mdi-creation",
  component: Stellarium,
},{
  name: "Capture",
  path: "/capture",
  icon: "mdi-camera",
  component: Capture,
},{
  name: "Mount",
  path: "/mount",
  icon: "mdi-telescope",
  component: Mount,
},{
  name: "Align",
  path: "/align",
  icon: "mdi-target",
  component: Align,
},{
  name: "Focus",
  path: "/focus",
  icon: "mdi-magnify",
  component: Focus,
},{
  name: "Guide",
  path: "/guide",
  icon: "mdi-compass",
  component: Guide,
},{
  name: "Logs",
  path: "/logs",
  icon: "mdi-comment",
  component: Logs,
},/*{
  name: "LiveStack",
  path: "/livestack",
  icon: "mdi-camera",
  component: LiveStack,
},{
  name: "ControlPanel",
  label: "Control Panel",
  path: "/controlpanel",
  icon: "mdi-cogs",
  component: ControlPanel,
},*/{
  name: "Settings",
  path: "/settings",
  icon: "mdi-cog",
  component: Settings,
},];

export {
  routes
}
