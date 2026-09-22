import { Link } from "wouter";

type SiteLogoProps = {
  compact?: boolean;
};

export default function SiteLogo({ compact = false }: SiteLogoProps) {
  return (
    <Link href="/" className={`site-logo${compact ? " site-logo--compact" : ""}`} aria-label="L Studio — דף הבית">
      <span className="site-logo__mark">
        <img src={`${import.meta.env.BASE_URL}assets/logo.png`} alt="" />
      </span>
      <span className="site-logo__type">
        <strong>L Studio</strong>
        {!compact && <small>MICROTONAL WORKSTATION</small>}
      </span>
    </Link>
  );
}
