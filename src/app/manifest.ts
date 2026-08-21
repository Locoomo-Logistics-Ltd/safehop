import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
      "name": "Locoomo — Send & Track Parcels",
      "short_name": "Locoomo",
      "description": "Affordable, reliable parcel delivery across your city.",
      "start_url": "/dashboard",
      "scope": "/",
      "display": "standalone",
      "background_color": "#F7F9FC",
      "theme_color": "#006CDF",
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}