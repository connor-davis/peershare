import {MatchRoute} from '@rturnq/solid-router';
import SetupPage from './pages/SetupPage';
import {Switch} from 'solid-js';
import HomePage from "./pages/HomePage";

function App() {
    return (
        <div class="dark">
            <div
                class="flex flex-col w-screen h-screen text-black bg-white dark:text-white dark:bg-gray-900">
                <Switch>
                    <MatchRoute path="/" end>
                        <SetupPage/>
                    </MatchRoute>
                    <MatchRoute path="/home">
                        <HomePage/>
                    </MatchRoute>
                </Switch>
            </div>
        </div>
    );
}

export default App;
