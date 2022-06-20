import { createSignal } from 'solid-js';

let RegisterPage = ({ onChangeAuthPage = () => {} }) => {
  let [username, setUsername] = createSignal('');
  let [password, setPassword] = createSignal('');
  let [confirmPassword, setConfirmPassword] = createSignal('');

  const authenticate = () => {
    if (password() === confirmPassword())
      send('register', { username: username(), password: password() });
  };

  return (
    <div class="flex flex-col w-auto max-w-sm h-auto p-5 border-l border-t border-r border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl shadow-gray-400 dark:shadow-black space-y-10">
      <div class="flex flex-col justify-center items-center text-center space-y-1">
        <div class="text-2xl font-bold text-green-600">PeerShare</div>
        <div class="text-md text-gray-500 dark:text-gray-400">
          Welcome to PeerShare, please create your account.
        </div>
      </div>
      <form class="flex flex-col w-full h-auto space-y-3">
        <input
          type="text"
          name="username"
          id="username"
          autocomplete="username"
          placeholder="Your username"
          value={username()}
          onChange={(event) => setUsername(event.target.value)}
          class="px-3 py-2 bg-gray-200 dark:bg-gray-900 rounded-lg text-black dark:text-white outline-none select-none focus:outline-green-500"
        />
        <input
          type="password"
          name="password"
          id="password"
          autocomplete="password"
          placeholder="Your password"
          value={password()}
          onChange={(event) => setPassword(event.target.value)}
          class="px-3 py-2 bg-gray-200 dark:bg-gray-900 rounded-lg text-black dark:text-white outline-none select-none focus:outline-green-500"
        />
        <input
          type="password"
          name="confirmPassword"
          id="confirmPassword"
          autocomplete="confirmPassword"
          placeholder="Confirm your password"
          value={confirmPassword()}
          onChange={(event) => setConfirmPassword(event.target.value)}
          onKeyPress={(event) => {
            if (event.key === 'Enter') {
              setConfirmPassword(event.target.value);
              authenticate();
            }
          }}
          class="px-3 py-2 bg-gray-200 dark:bg-gray-900 rounded-lg text-black dark:text-white outline-none select-none focus:outline-green-500"
        />
      </form>
      <div class="flex flex-col space-y-2">
        <div
          class="flex justify-center items-center px-3 py-2 text-black bg-green-600 rounded-md cursor-pointer select-none"
          onClick={() => authenticate()}
        >
          Register
        </div>
        <div class="text-center w-full h-auto break-all text-gray-400">
          Already have an account?{' '}
          <span
            class="font-bold text-green-500 cursor-pointer"
            onClick={() => onChangeAuthPage()}
          >
            Login
          </span>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
