import path from 'path';
import { defineConfig } from 'vite';

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

// Plain HTML / CSS / JS static site -- no framework, no JSX.
// Vite is used only as a lightweight static dev server + multi-page bundler.
export default defineConfig({
  base: basePath,
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(import.meta.dirname, 'index.html'),
        about: path.resolve(import.meta.dirname, 'about.html'),
        contact: path.resolve(import.meta.dirname, 'contact.html'),
        privacy: path.resolve(import.meta.dirname, 'privacy.html'),
        terms: path.resolve(import.meta.dirname, 'terms.html'),
        cookies: path.resolve(import.meta.dirname, 'cookies.html'),
        disclaimer: path.resolve(import.meta.dirname, 'disclaimer.html'),
        login: path.resolve(import.meta.dirname, 'login.html'),
        register: path.resolve(import.meta.dirname, 'register.html'),
        article: path.resolve(import.meta.dirname, 'article.html'),
        category: path.resolve(import.meta.dirname, 'category.html'),
        search: path.resolve(import.meta.dirname, 'search.html'),
        adminLogin: path.resolve(import.meta.dirname, 'admin/login.html'),
        adminIndex: path.resolve(import.meta.dirname, 'admin/index.html'),
        adminPosts: path.resolve(import.meta.dirname, 'admin/posts.html'),
        adminEditor: path.resolve(import.meta.dirname, 'admin/editor.html'),
        adminComments: path.resolve(import.meta.dirname, 'admin/comments.html'),
        adminSubscribers: path.resolve(import.meta.dirname, 'admin/subscribers.html'),
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
