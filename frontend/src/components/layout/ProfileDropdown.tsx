import { useState } from 'react';
import { LogOut } from 'lucide-react';

export function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  // Get the current user from session storage
  const currentUser = JSON.parse(sessionStorage.getItem("User"));
  const initials = `${currentUser?.firstName?.[0] || ''}${currentUser?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="relative">
      <button
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-pink-500 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-transform hover:scale-105"
        onClick={() => setIsOpen(!isOpen)}
      >
        {initials || 'U'}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
            <div className="border-b border-gray-100 p-4">
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-pink-500 text-sm font-bold text-white">
                  {initials}
                </div>
                <div className="ml-3 min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {`${currentUser.firstName.trim()} ${currentUser.lastName.trim()}`}
                  </p>
                  <p className="truncate text-sm text-gray-500">{currentUser.email}</p>
                </div>
              </div>
            </div>

            <div className="p-1">
              <button
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                onClick={() => {
                  sessionStorage.clear();
                  window.location.href = "/login";
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
