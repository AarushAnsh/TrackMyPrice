import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

 

export const metadata = {
  title: "Deal Drop",
  description: "For comparing price",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"> 
      <body> {children}
      <Toaster richColors/>
      </body>
    </html>
  );
}
