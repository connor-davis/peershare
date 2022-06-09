import { MatchRoute } from '@rturnq/solid-router';
import SendPage from './pages/SendPage';
import SetupPage from './pages/SetupPage';
import { Switch } from 'solid-js';

function App() {
  return (
    <div class="dark">
      <div class="flex flex-col justify-center items-center w-screen h-screen text-black bg-white dark:text-white dark:bg-gray-900">
        <Switch>
          <MatchRoute path="/" end>
            <SetupPage />
          </MatchRoute>
          <MatchRoute path="/send">
            <SendPage />
          </MatchRoute>
          <MatchRoute path="/receive">
            <ReceivePage />
          </MatchRoute>
        </Switch>
      </div>
    </div>
  );
}

export default App;
