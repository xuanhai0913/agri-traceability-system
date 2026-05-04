import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Skeleton from "./components/ui/Skeleton";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./components/auth/AuthProvider";

/* ── Lazy-loaded pages ─── */
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const TraceabilityLedgerPage = lazy(() => import("./pages/TraceabilityLedgerPage"));
const InventoryPage = lazy(() => import("./pages/InventoryPage"));
const CreateBatchPage = lazy(() => import("./pages/CreateBatchPage"));
const BatchDetailPage = lazy(() => import("./pages/BatchDetailPage"));
const ProducerNetworkPage = lazy(() => import("./pages/ProducerNetworkPage"));
const ProducerDetailPage = lazy(() => import("./pages/ProducerDetailPage"));
const CompliancePage = lazy(() => import("./pages/CompliancePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));

/** Route-level loading fallback */
function RouteFallback() {
  return (
    <div className="space-y-6 animate-in">
      <Skeleton className="h-10 w-64 mb-2" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
      <Skeleton className="h-64 rounded-2xl mt-4" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#1c1f1d', color: '#fff' } }} />
        <Routes>
          <Route
            path="/login"
            element={
              <Suspense fallback={<RouteFallback />}>
                <LoginPage />
              </Suspense>
            }
          />
          <Route element={<AppLayout />}>
          <Route
            index
            element={
              <Suspense fallback={<RouteFallback />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="/batches"
            element={
              <Suspense fallback={<RouteFallback />}>
                <TraceabilityLedgerPage />
              </Suspense>
            }
          />
          <Route
            path="/batches/new"
            element={
              <Suspense fallback={<RouteFallback />}>
                <CreateBatchPage />
              </Suspense>
            }
          />
          <Route
            path="/batches/:id"
            element={
              <Suspense fallback={<RouteFallback />}>
                <BatchDetailPage />
              </Suspense>
            }
          />
          <Route
            path="/inventory"
            element={
              <Suspense fallback={<RouteFallback />}>
                <InventoryPage />
              </Suspense>
            }
          />
          <Route
            path="/producers"
            element={
              <Suspense fallback={<RouteFallback />}>
                <ProducerNetworkPage />
              </Suspense>
            }
          />
          <Route
            path="/producers/:id"
            element={
              <Suspense fallback={<RouteFallback />}>
                <ProducerDetailPage />
              </Suspense>
            }
          />
          <Route
            path="/compliance"
            element={
              <Suspense fallback={<RouteFallback />}>
                <CompliancePage />
              </Suspense>
            }
          />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
