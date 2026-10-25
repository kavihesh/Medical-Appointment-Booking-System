import { createContext, useContext, useEffect } from 'react';
import { APP_NAME } from '../config.js';

/** Lets each page tell the shell its breadcrumb trail (shown in the top bar). */
export const BreadcrumbContext = createContext(() => {});

/** Sets the browser tab title and the top-bar breadcrumbs for the current page. */
export function usePageMeta(title, crumbs) {
  const setCrumbs = useContext(BreadcrumbContext);
  const crumbKey = JSON.stringify(crumbs);

  useEffect(() => {
    document.title = `${title} - ${APP_NAME}`;
    setCrumbs([...JSON.parse(crumbKey), { label: title }]);
  }, [title, crumbKey, setCrumbs]);
}
