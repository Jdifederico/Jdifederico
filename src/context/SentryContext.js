import React from "react";
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://195d896ad5a4430cabe45418a84a54a7@o187074.ingest.sentry.io/4505189094785024",
  release: '2.658',
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Integrations.Breadcrumbs({ console: false,})
  ],
  tracesSampleRate: 1.0,
});


const SentryContext = React.createContext(null);

export const SentryContextProvider = ({ children }) => {
    return(
        <SentryContext.Provider value={{ Sentry}}>
        {children}
        </SentryContext.Provider>
    );
}
export const useSentry =() =>{
    return React.useContext(SentryContext);
  
}