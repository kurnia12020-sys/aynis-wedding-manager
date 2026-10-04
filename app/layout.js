import './globals.css';

export const metadata = {
  title: 'Aynis Wedding Manager V4.7',
  description: 'Finance Flow — Wedding & Finance Management for Aynis Anis Makeup',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
