import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import "@/styles/index.css";
import { RootLayout } from "@/layouts/RootLayout";
import { RouteError } from "@/pages/RouteError";
import HomePage from "@/pages/HomePage";

const StoryPage = lazy(() => import("@/story/StoryPage"));
const ProjectPage = lazy(() => import("@/pages/ProjectPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

const router = createBrowserRouter([
  {
    // The story walk is the front door; it brings its own chrome.
    path: "/",
    element: (
      <Suspense fallback={<div style={{ minHeight: "100svh", background: "#0b1230" }} aria-busy="true" />}>
        <StoryPage />
      </Suspense>
    ),
    errorElement: <RouteError />,
  },
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { path: "index", element: <HomePage /> },
      { path: "work/:slug", element: <ProjectPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
