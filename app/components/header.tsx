

export default function Header() {
  return (
    <header className="flex items-center justify-end rounded-2xl bg-gray-100 dark:bg-gray-800 p-4 shadow-2xl">
      
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-100">Youssef Karam</p>
          <p className="text-xs text-green-400 dark:text-green-700">Admin</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white">
          YK
        </div>
      </div>
    </header>
  );
}
