import type {Metadata} from "next"; import "./globals.css"; import {Header,Footer,Welcome,CookieNotice} from "@/components/site";
export const metadata:Metadata={title:"Alerte Citoyen — Signaler, Alerter, Protéger",description:"Plateforme citoyenne d'alerte et d'entraide."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><body><Header/>{children}<Footer/><Welcome/><CookieNotice/></body></html>}
