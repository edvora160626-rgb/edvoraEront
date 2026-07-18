import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const APP_TITLE = "Edvora";
const DEFAULT_DESCRIPTION =
  "Edvora school management portal for principals, school admins, teachers, parents, and students. Manage registration requests, departments, and classes.";

const ROUTE_SEO = [
  {
    match: (path) => path === "/",
    description:
      "Sign in to Edvora to manage your school portal, requests, departments, and classes.",
  },
  {
    match: (path) => path === "/register",
    description:
      "Create an Edvora account to join your school as a teacher, parent, student, or admin.",
  },
  {
    match: (path) => path.startsWith("/forgot-password"),
    description:
      "Reset your Edvora account password securely with email verification.",
  },
  {
    match: (path) => path === "/admin/dashboard" || path === "/admin",
    description:
      "View pending school registration requests and portal activity on Edvora.",
  },
  {
    match: (path) => path === "/admin/requests",
    description:
      "Review, approve, or reject office, teacher, parent, and student registration requests.",
  },
  {
    match: (path) => path === "/admin/departments",
    description: "Create and manage school departments in the Edvora admin portal.",
  },
  {
    match: (path) => path === "/admin/classes",
    description: "Create and manage school classes and sections in Edvora.",
  },
];

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function DocumentSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = ROUTE_SEO.find((item) => item.match(pathname));
    const description = seo?.description || DEFAULT_DESCRIPTION;

    document.title = APP_TITLE;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", APP_TITLE);
    upsertMeta("property", "og:description", description);
    upsertMeta("name", "twitter:title", APP_TITLE);
    upsertMeta("name", "twitter:description", description);

    const canonical = document.head.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute("href", `${window.location.origin}${pathname}`);
    }
  }, [pathname]);

  return null;
}

export default DocumentSeo;
