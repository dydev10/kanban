import { FC, FormEvent, useState } from "react";
import usePocket from "./hooks/usePocket";

interface ModalProps {
  isOpen: boolean,
  onCancel: () => void,
}

const LoginForm: FC<ModalProps> = ({ isOpen, onCancel }) => {
  const { login, authError } = usePocket();

  const [isTrying, setIsTrying] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  
  if (!isOpen) {
    return;
  }

  const handleComplete = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Trying to login...');

    setIsTrying(true);
    await login(email, password);
    setIsTrying(false);

    console.log('Logged In user');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-2xl flex">
        <div className="w-1/2 p-8 flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 bg-[length:200%_200%] animate-gradient-move">
          <h2 className="text-white text-3xl font-bold">Kanban Board</h2>
        </div>
        <div className="w-1/2 p-8 flex flex-col items-center">
          <div className="w-full flex flex-col items-center mb-6">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-purple-500">Login</h2>
            <button onClick={onCancel} className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">✖</button>
          </div>
          <form className="space-y-5 w-full flex flex-col items-center" onSubmit={handleComplete}>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-300">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                required
                className="w-full px-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-300">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                required
                className="w-full px-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button disabled={isTrying} type="submit" className="w-fit flex items-center justify-center gap-2 text-lg p-2 bg-purple-600 dark:bg-purple-500 text-white rounded-md">
              {
                isTrying ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing In...
                  </>
                ) : "Sign In"
              }
            </button>
            {
              !!authError && (
                <div className="text-xs p-1 font-medium text-red-300 border border-red-300 rounded-xl">
                  {authError}
                </div>
              )
            }
            <button disabled={isTrying} onClick={onCancel} className="w-fit flex items-center justify-center gap-2 text-sm underline underline-offset-4 bg-none dark:bg-none text-pink-300 hover:text-orange-300">
              Guest Mode
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
