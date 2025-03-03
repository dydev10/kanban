import { useState } from "react";
import { FaChevronDown, FaSignOutAlt, FaCog } from "react-icons/fa";
import usePocket from "./hooks/usePocket";


export default function HeaderBar() {
  const { user, logout } = usePocket();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  function handleLogout() {
    logout();
    window.location.reload();
  }

  return (
    <div className="flex justify-between items-center p-4 bg-gray-800 text-white shadow-md relative z-50">
      <h1 className="text-xl font-bold">Kanban Board</h1>

      {user && (
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 bg-gray-700 px-4 py-2 rounded-md"
          >
            {user.username || user.email}
            <FaChevronDown />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white text-gray-900 rounded-md shadow-lg z-50 overflow-hidden">
              <button className="flex items-center w-full px-4 py-2 hover:bg-gray-100">
                <FaCog className="mr-2" /> Settings
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-red-500 hover:bg-gray-100"
              >
                <FaSignOutAlt className="mr-2" /> Logout
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
