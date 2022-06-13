import {MatchRoute} from '@rturnq/solid-router';
import SetupPage from './pages/SetupPage';
import {Switch} from 'solid-js';
import HomePage from "./pages/HomePage";
import CloseIcon from "./components/icons/CloseIcon";
import MaximizeIcon from "./components/icons/MaximizeIcon";

function App() {
    return (
        <div class="dark rounded-lg">
            <div
                class="flex flex-col w-screen h-screen text-black bg-white dark:text-white dark:bg-gray-900 rounded-lg">
                <div class={"flex justify-between items-center w-full bg-gray-800 rounded-t-lg"} style={{"-webkit-app-region": "drag"}}>
                    <div></div>
                    <div class={"flex items-center"}  style={{"-webkit-app-region": "no-drag"}}>
                        <div
                            class={"flex flex-col w-6 h-6 justify-center items-center p-2 hover:bg-gray-700 cursor-pointer"}
                        onClick={() => {
                            send("minimizeWindow")
                        }}>
                            <div class={"w-2 h-[1px] rounded-full bg-white"}></div>
                        </div>
                        <div
                            class={"flex flex-col w-6 h-6 justify-center items-center p-2 hover:bg-gray-700 cursor-pointer"}onClick={() => {
                            send("toggleMaximizeWindow")
                        }}>
                            <MaximizeIcon/>
                        </div>
                        <div
                            class={"flex flex-col w-6 h-6 justify-center items-center p-2 hover:bg-red-500 cursor-pointer rounded-tr-lg"}onClick={() => {
                            send("closeWindow")
                        }}>
                            <CloseIcon/>
                        </div>
                    </div>
                </div>
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
