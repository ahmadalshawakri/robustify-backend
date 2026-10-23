import { RouterProvider, createBrowserRouter } from "react-router";
import { useAuth } from "./auth/AuthProvider";
import { HomeRedirect, RequireAuth, RequireRole } from "./auth/guards";
import { AppShell } from "./layout/AppShell";
import { InventoryPage } from "./pages/InventoryPage";
import { LoginPage } from "./pages/LoginPage";
import { MyWorkPage } from "./pages/MyWorkPage";
import { ComplaintsPage } from "./pages/complaints/ComplaintsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { NewOrderPage } from "./pages/orders/NewOrderPage";
import { OrderDetailPage } from "./pages/orders/OrderDetailPage";
import { OrdersPage } from "./pages/orders/OrdersPage";
import { NewPurchasePage } from "./pages/purchases/NewPurchasePage";
import { InvoicePage } from "./pages/invoices/InvoicePage";
import { PurchasesPage } from "./pages/purchases/PurchasesPage";
import { TeamPage } from "./pages/team/TeamPage";

function Shell() {
  const { signOut } = useAuth();
  return <AppShell onSignOut={signOut} />;
}

export const routes = [
  { path: "/login", element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <Shell />,
        children: [
          { index: true, element: <HomeRedirect /> },
          {
            element: <RequireRole role="ADMIN" />,
            children: [
              {
                path: "dashboard",
                // The charts library is the heaviest dependency; only admins need it.
                lazy: async () => ({
                  Component: (await import("./pages/DashboardPage")).DashboardPage,
                }),
              },
              { path: "orders", element: <OrdersPage /> },
              { path: "orders/new", element: <NewOrderPage /> },
              { path: "purchases", element: <PurchasesPage /> },
              { path: "purchases/new", element: <NewPurchasePage /> },
              { path: "team", element: <TeamPage /> },
              {
                path: "invoices",
                lazy: async () => ({
                  Component: (await import("./pages/invoices/InvoicesPage")).InvoicesPage,
                }),
              },
              { path: "invoices/:id", element: <InvoicePage /> },
              {
                path: "quality",
                lazy: async () => ({
                  Component: (await import("./pages/quality/QualityPage")).QualityPage,
                }),
              },
            ],
          },
          { path: "orders/:id", element: <OrderDetailPage /> },
          { path: "my-work", element: <MyWorkPage /> },
          { path: "complaints", element: <ComplaintsPage /> },
          { path: "inventory", element: <InventoryPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
];

const router = createBrowserRouter(routes);

export function App() {
  return <RouterProvider router={router} />;
}
