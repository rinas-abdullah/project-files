import { StrictMode, lazy } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import "@/styles/index.css";
import { RootLayout } from "@/layouts/RootLayout";
import { RouteError } from "@/pages/RouteError";
import HomePage from "@/pages/HomePage";

const ProjectPage = lazy(() => import("@/pages/ProjectPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
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
