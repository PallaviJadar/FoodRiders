import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    base: '/',
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:5000',
                changeOrigin: true
            },
            '/socket.io': {
                target: 'http://127.0.0.1:5000',
                ws: true,
                changeOrigin: true
            },
            '/uploads': {
                target: 'http://127.0.0.1:5000',
                changeOrigin: true
            }
        }
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        target: 'esnext',
        minify: 'esbuild',
        chunkSizeWarningLimit: 2000,
        rollupOptions: {
            input: 'index.html',
            output: {
                manualChunks: {
                    'vendor': [
                        'react',
                        'react-dom',
                        'react-router-dom',
                        'framer-motion',
                        'axios',
                        'socket.io-client'
                    ],
                    'maps': ['leaflet', 'react-leaflet'],
                    'three': ['three', '@react-three/fiber', '@react-three/drei']
                }
            }
        },
        // Remove console.log/debugger in production builds (keeps console.error)
        esbuild: {
            drop: ['debugger'],
            pure: ['console.log']
        }
    },
    optimizeDeps: {
        include: ['@react-three/fiber', '@react-three/drei', 'three']
    }
})
