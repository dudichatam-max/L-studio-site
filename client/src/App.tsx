import { lazy, Suspense, useEffect } from "react";
import { Route, Router as WouterRouter, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider, legacyBase, useLanguage } from "./contexts/LanguageContext";
import { languageHref, useLanguageLocation } from "./lib/languageRouting";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// Inner pages load on demand so the homepage ships less JavaScript.
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Guide = lazy(() => import("./pages/Guide"));
const Factory64 = lazy(() => import("./pages/Factory64"));
const FactoryDrums = lazy(() => import("./pages/FactoryDrums"));
const Exclusive = lazy(() => import("./pages/Exclusive"));
const Updates = lazy(() => import("./pages/Updates"));
const Buy = lazy(() => import("./pages/Buy"));
import DocumentSeo from "./components/DocumentSeo";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, "");
    if (raw) {
      let id = raw;
      try {
        id = decodeURIComponent(raw);
      } catch {
        id = raw;
      }
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView();
        return;
      }
    }
    // Path-only: keep same-page hash jumps (TOC) intact.
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location]);
  return null;
}

function Router() {
  // Re-render links when the language changes (hrefs read the active language).
  useLanguage();
  return (
    <WouterRouter base={legacyBase()} hook={useLanguageLocation} hrefs={languageHref}>
      <ScrollToTop />
      <DocumentSeo />
      <Suspense fallback={null}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/guide" component={Guide} />
        <Route path="/buy/success">{() => <Buy mode="success" />}</Route>
        <Route path="/buy">{() => <Buy mode="checkout" />}</Route>
        <Route path="/factory-64/drums" component={FactoryDrums} />
        <Route path="/factory-64" component={Factory64} />
        <Route path="/exclusive" component={Exclusive} />
        <Route path="/updates" component={Updates} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
      </Suspense>
    </WouterRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider defaultTheme="dark">
          <Router />
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
