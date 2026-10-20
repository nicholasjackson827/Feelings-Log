import { defineConfig, type Preset } from '@vite-pwa/assets-generator/config'

// The source SVG is full-bleed with the artwork inside the maskable safe zone,
// so no extra padding is needed for any variant.
const preset: Preset = {
  transparent: { sizes: [64, 192, 512], favicons: [[48, 'favicon.ico']], padding: 0 },
  maskable: { sizes: [512], padding: 0 },
  apple: { sizes: [180], padding: 0 },
}

export default defineConfig({
  preset,
  images: ['public/icon.svg'],
})
