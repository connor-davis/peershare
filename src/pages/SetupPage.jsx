import {createSignal} from 'solid-js';
import {useRouter} from '@rturnq/solid-router';

const SetupPage = () => {
    let router = useRouter();

    let [sessionName, setSessionName] = createSignal('');
    let [sessionPassword, setSessionPassword] = createSignal('');
    let [connecting, setConnecting] = createSignal(false);

    const joinSwarm = () => {
        if (sessionName().length === 0 || sessionPassword().length === 0) return console.log("Missing information...");

        send("connect-swarm", sessionName() + "@" + sessionPassword());

        setConnecting(true);

        receive("swarm-connected", () => {
            router.push("/home");
        });
    }

    return (
        <div class="flex flex-col w-full h-full justify-center items-center">
            {connecting() && <div class={"flex space-x-2 items-center"}>
                <div>Connecting...</div>
                <div class={"animate-spin w-5 h-5 border-l border-t border-green-500 border-1 rounded-full"}></div>
            </div>}

            {!connecting() && <div
                class="flex flex-col w-auto max-w-sm h-auto p-5 border-l border-t border-r border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl shadow-gray-400 dark:shadow-black space-y-10">
                <div class="flex flex-col justify-center items-center text-center space-y-1">
                    <div class="text-2xl font-bold text-green-600">PeerShare</div>
                    <div class="text-md text-gray-500 dark:text-gray-400">
                        Welcome to PeerShare, please enter the domain to connect to.
                    </div>
                </div>
                <form class="flex flex-col w-full h-auto space-y-3">
                    <input
                        type="text"
                        name="sessionName"
                        id="sessionName"
                        autocomplete="sessionName"
                        placeholder="Session name - e.g. test"
                        value={sessionName()}
                        onChange={(event) => setSessionName(event.target.value)}
                        class="px-3 py-2 bg-gray-200 dark:bg-gray-900 rounded-lg text-black dark:text-white outline-none select-none focus:outline-green-500"
                    />
                    <input
                        type="password"
                        name="sessionPassword"
                        id="sessionPassword"
                        autocomplete="sessionPassword"
                        placeholder="Session password - e.g. test"
                        value={sessionPassword()}
                        onChange={(event) => setSessionPassword(event.target.value)}
                        onKeyPress={(event) => {
                            if (event.key === "Enter") {
                                setSessionPassword(event.target.value);
                                joinSwarm();
                            }
                        }}
                        class="px-3 py-2 bg-gray-200 dark:bg-gray-900 rounded-lg text-black dark:text-white outline-none select-none focus:outline-green-500"
                    />
                </form>
                <div class="flex flex-col space-y-2">
                    <div
                        class="flex justify-center items-center px-3 py-2 text-black bg-green-600 rounded-md cursor-pointer select-none"
                        onClick={() => joinSwarm()}
                    >
                        Join
                    </div>
                </div>
            </div>}
        </div>
    );
};

export default SetupPage;
