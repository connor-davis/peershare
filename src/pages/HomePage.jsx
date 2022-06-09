import {useRouter} from "@rturnq/solid-router";
import {createSignal, onMount} from "solid-js";
import {createStore} from "solid-js/store";

const HomePage = () => {
    const router = useRouter();

    let [peerData, setPeerData] = createStore({peerCount: 0}, {name: "peer-count-store"});
    let [leaving, setLeaving] = createSignal(false);

    onMount(() => {
        send("peer-count");
        receive("peer-count", (event, count) => {
            setPeerData({...peerData, peerCount: count});
        });
    })

    const disconnectSwarm = () => {
        send("disconnect-swarm");

        setLeaving(true);

        receive("swarm-disconnected", () => router.push("/"));
    }

    return (
        <div class={"flex flex-col w-full h-full"}>
            {leaving() && <div class={"flex flex-col w-full h-full justify-center items-center"}>
                <div class={"flex space-x-2 items-center"}>
                    <div>Leaving...</div>
                    <div class={"animate-spin w-5 h-5 border-l border-t border-green-500 border-1 rounded-full"}></div>
                </div>
            </div>}

            {!leaving() && <>
                <div class={"w-full h-auto border-b border-gray-800"}>
                    <div class={"flex justify-between items-center p-2 border-b border-black"}>
                        <div class={"text-lg font-bold text-green-500"}>PeerShare</div>
                        <div class={"flex space-x-2"}>
                            <div
                                class={"flex items-center space-x-2 w-auto h-auto p-3 bg-green-500 bg-opacity-10 text-green-500 rounded-lg"}
                                title={"Swarm Peers"}>
                                <div>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
                                         viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                    </svg>
                                </div>
                                <div class={"text-sm"}>{peerData.peerCount}</div>
                            </div>
                            <div
                                class={"flex flex-col justify-center items-center w-auto h-auto p-3 bg-red-500 bg-opacity-10 text-red-500 rounded-lg cursor-pointer"}
                                title={"Disconnect"} onClick={() => disconnectSwarm()}>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                                     stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </>}
        </div>
    )
};

export default HomePage;