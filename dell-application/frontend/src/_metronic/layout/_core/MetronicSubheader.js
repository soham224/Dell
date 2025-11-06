import React, {createContext, useContext, useState, useMemo} from "react";

export function getBreadcrumbsAndTitle(menuId, pathName) {
  const result = {
    breadcrumbs: [],
    title: "",
  };

  const menu = document.getElementById(menuId);
  if (!menu) {
    return result;
  }

  const activeLinksArray = Array.from(
      menu.getElementsByClassName("active") || []
  );
  const activeLinks = activeLinksArray.filter((el) => el.tagName === "A");
  if (!activeLinks) {
    return result;
  }

  activeLinks.forEach((link) => {
    const titleSpans = link.getElementsByClassName("menu-text");
    if (titleSpans) {
      const titleSpan = Array.from(titleSpans).find(
          (t) => t.innerHTML && t.innerHTML.trim().length > 0
      );
      if (titleSpan) {
        result.breadcrumbs.push({
          pathname: link.pathname.replace(process.env.PUBLIC_URL, ""),
          title: titleSpan.innerHTML,
        });
      }
    }
  });
  result.title = getTitle(result.breadcrumbs, pathName);
  return result;
}

export function getTitle(breadCrumbs, pathname) {
  if (!breadCrumbs || !pathname) {
    return "";
  }

  const length = breadCrumbs.length;
  if (!length) {
    return "";
  }

  return breadCrumbs[length - 1].title;
}

const SubheaderContext = createContext();

export function useSubheader() {
  return useContext(SubheaderContext);
}

export const SubheaderConsumer = SubheaderContext.Consumer;

export function MetronicSubheaderProvider({children}) {
  const [title, setTitle] = useState("");
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  // useMemo to memoize the context value
  const value = useMemo(
    () => ({ title, setTitle, breadcrumbs, setBreadcrumbs }),
    [title, breadcrumbs]
  );

  return (
    <SubheaderContext.Provider value={value}>
      {children}
    </SubheaderContext.Provider>
  );
}
