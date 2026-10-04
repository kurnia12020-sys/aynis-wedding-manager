import './globals.css';

export const metadata = {
  title: 'Aynis Wedding Manager V3.0',
  description: 'Finance Flow — Wedding & Finance Management for Aynis Anis Makeup',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
