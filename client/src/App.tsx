import { useEffect } from "react";
import { Route, Router as WouterRouter, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Guide from "./pages/Guide";
import Factory64 from "./pages/Factory64";
import FactoryDrums from "./pages/FactoryDrums";
import NotFound from "./pages/NotFound";
import Buy from "./pages/Buy";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    // Path-only: keep same-page hash jumps (TOC) intact.
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location]);
  return null;
}

function Router() {
  const base = window.location.pathname.startsWith("/L-studio-site") ? "/L-studio-site" : "";
  return (
    <WouterRouter base={base}>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/guide" component={Guide} />
        <Route path="/buy/success">{() => <Buy mode="success" />}</Route>
        <Route path="/buy">{() => <Buy mode="checkout" />}</Route>
        <Route path="/factory-64/drums" component={FactoryDrums} />
        <Route path="/factory-64" component={Factory64} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
