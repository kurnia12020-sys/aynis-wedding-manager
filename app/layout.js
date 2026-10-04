import './globals.css';
import PWARegister from './pwa-register';

export const metadata = {
  title: 'AYNIS Wedding Manager',
  description: 'Wedding & Finance Management for Aynis Anis Makeup',
  applicationName: 'AYNIS Wedding Manager',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/aynis-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/aynis-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/aynis-apple-180.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'AYNIS',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#7f6878',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
