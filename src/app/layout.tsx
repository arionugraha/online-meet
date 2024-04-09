import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import NavBar from "@/components/NavBar";
import StreamClientProvider from "./StreamClientProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
   title: "Online Meeting App",
   description: "SaaS for online meetings and video conferencing.",
};

export default function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) {
   return (
      <ClerkProvider>
         <html lang="en">
            <body className={inter.className}>
               <StreamClientProvider>
                  <NavBar />
                  <main className="mx-auto max-w-5xl px-3 py-6">{children}</main>
               </StreamClientProvider>
            </body>
         </html>
      </ClerkProvider>
   );
}
