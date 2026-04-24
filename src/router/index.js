/**
 * router/index.js
 *
 * Manually defined routes replacing the automatic `vue-router/auto` behaviour.
 * You can control path, name and props directly here.
 */

// Composables

import { createRouter, createWebHistory } from 'vue-router';

// helpers for lazy-loading page components
const Home = () => import('@/pages/index.vue');
const Forecast = () => import('@/pages/Forecast.vue');
const Details = () => import('@/pages/Details.vue');

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home,
    },
    {
        path: '/forecast',
        name: 'Forecast',
        component: Forecast,
        meta: {
            title: 'Sääennuste',
        },
        // pass query parameters as props so the component can access them directly
        props: (route) => ({ ...route.query }),
    },
    {
        path: '/details',
        name: 'Details',
        component: Details,
        meta: {
            title: 'Ennusteen yksityiskohdat',
        },
    },
    {
        path: '/details/:id',
        name: 'DetailsWithId',
        component: Details,
        // route param `id` will be available as a prop
        props: true,
        meta: {
            title: 'Ennusteen yksityiskohdat',
        },
    },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
});

router.beforeEach((to, from, next) => {
    next();
});

// Workaround for   https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
    if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
        if (localStorage.getItem('vuetify:dynamic-reload')) {
            console.error('Dynamic import error, reloading page did not fix it', err);
        } else {
            console.log('Reloading page to fix dynamic import error');
            localStorage.setItem('vuetify:dynamic-reload', 'true');
            location.assign(to.fullPath);
        }
    } else {
        console.error(err);
    }
});

router.isReady().then(() => {
    localStorage.removeItem('vuetify:dynamic-reload');
});

export default router;
