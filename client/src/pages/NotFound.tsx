import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import SiteLogo from "@/components/SiteLogo";

export default function NotFound() {
  return <div className="site-shell"><header className="site-header"><div className="container header-inner"><SiteLogo /></div></header><main className="container" style={{ minHeight: "70vh", display: "grid", placeItems: "center", textAlign: "center" }}><div><span className="kicker">ERROR / 404</span><h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(64px, 12vw, 150px)", lineHeight: ".9", letterSpacing: "-.08em", margin: "20px 0" }}>לא כאן.<br /><em style={{ color: "var(--acid)", fontStyle: "normal" }}>חוזרים לקצב.</em></h1><Link className="button button--primary" href="/">חזרה לדף הבית <ArrowLeft size={16} /></Link></div></main></div>;
}
