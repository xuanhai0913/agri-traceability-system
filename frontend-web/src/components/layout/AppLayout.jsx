import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopNav />
      <main className="ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}
