import { createSignal, onMount } from 'solid-js';

import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import { useRouter } from '@rturnq/solid-router';
import useState from '../../hooks/state';

const AuthenticationPage = () => {
  const router = useRouter();

  let [isLoginPage, setIsLoginPage] = createSignal(true);
  let [authenticating, setAuthenticating] = createSignal(false);
  let [failedLogin, setFailedLogin] = createSignal(false);
  let [failedRegister, setFailedRegister] = createSignal(false);

  let [userState, updateUserState] = useState('user');

  onMount(() => {
    receive('authenticating', () => {
      setAuthenticating(true);
    });

    receive('auth-login', (event, data) => {
      if (data) {
        setAuthenticating(false);

        updateUserState(data);

        router.push('/home');
      } else {
        setAuthenticating(false);
        setFailedLogin(true);

        setTimeout(() => {
          setFailedLogin(false);
        }, 3000);
      }
    });

    receive('auth-register', (event, data) => {
      if (data) {
        setAuthenticating(false);

        updateUserState(data);

        router.push('/home');
      } else {
        setAuthenticating(false);
        setFailedRegister(true);

        setTimeout(() => {
          setFailedRegister(false);
        }, 3000);
      }
    });
  });

  return (
    <div class="flex flex-col w-full h-full justify-center items-center">
      {failedLogin() && (
        <div class={'flex space-x-2 items-center'}>
          <div>Username or password incorrect...</div>
          <div
            class={
              'animate-spin w-5 h-5 border-l border-t border-red-500 border-1 rounded-full'
            }
          ></div>
        </div>
      )}

      {failedRegister() && (
        <div class={'flex space-x-2 items-center'}>
          <div>Username is already in use on system...</div>
          <div
            class={
              'animate-spin w-5 h-5 border-l border-t border-red-500 border-1 rounded-full'
            }
          ></div>
        </div>
      )}

      {!failedLogin() && !failedRegister() && authenticating() && (
        <div class={'flex space-x-2 items-center'}>
          <div>Authenticating...</div>
          <div
            class={
              'animate-spin w-5 h-5 border-l border-t border-green-500 border-1 rounded-full'
            }
          ></div>
        </div>
      )}

      {isLoginPage()
        ? !failedLogin() &&
          !authenticating() && (
            <LoginPage onChangeAuthPage={() => setIsLoginPage(false)} />
          )
        : !failedRegister() &&
          !authenticating() && (
            <RegisterPage onChangeAuthPage={() => setIsLoginPage(true)} />
          )}
    </div>
  );
};

export default AuthenticationPage;
