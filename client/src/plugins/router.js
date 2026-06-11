import { routes } from '@/util/routes';
import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(),
  routes: routes.map(r => ({
    name: r.name,
    path: r.path,
    component: r.component,
  })),
});

export default router;