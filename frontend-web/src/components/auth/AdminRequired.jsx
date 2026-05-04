import { Link } from "react-router-dom";
import { Lock, LogIn } from "lucide-react";

export default function AdminRequired({
  title = "Cần đăng nhập admin",
  body = "Chức năng ghi dữ liệu chỉ dành cho tài khoản vận hành AgriTrace.",
}) {
  return (
    <div className="max-w-2xl mx-auto bg-surface-container-lowest rounded-2xl shadow-ambient p-8 md:p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-5">
        <Lock size={26} />
      </div>
      <h1 className="text-2xl md:text-3xl font-black text-emerald-900 font-headline">
        {title}
      </h1>
      <p className="text-slate-500 mt-3 leading-relaxed">{body}</p>
      <Link
        to="/login"
        className="mt-7 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl btn-primary-gradient font-bold text-sm"
      >
        <LogIn size={18} />
        Đăng nhập để thao tác
      </Link>
    </div>
  );
}
