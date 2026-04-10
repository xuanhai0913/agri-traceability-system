import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import CreateBatchPage from "./pages/CreateBatchPage";
import BatchDetailPage from "./pages/BatchDetailPage";

function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-slate-400">
      <span className="material-symbols-outlined text-6xl mb-4">
        construction
      </span>
      <h2 className="text-2xl font-bold text-on-surface mb-2 font-headline">
        {title}
      </h2>
      <p className="text-sm">Tính năng đang được phát triển...</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/batches" element={<DashboardPage />} />
          <Route path="/batches/new" element={<CreateBatchPage />} />
          <Route path="/batches/:id" element={<BatchDetailPage />} />
          <Route
            path="/inventory"
            element={<ComingSoon title="Inventory" />}
          />
          <Route
            path="/producers"
            element={<ComingSoon title="Producer Network" />}
          />
          <Route
            path="/compliance"
            element={<ComingSoon title="Compliance" />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
