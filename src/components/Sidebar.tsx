import { useAuth } from "../providers/authprovider";

export default function Sidebar() {
  const { signOut } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-4 font-semibold">flowwrk</div>

      <nav className="flex-1 px-2">{/* nav items */}</nav>

      <div className="p-4 border-t border-slate-200">
        <button
          onClick={signOut}
          className="w-full text-left text-sm text-slate-700 hover:underline"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
