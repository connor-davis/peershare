import {useRouter} from "@rturnq/solid-router";
import {createSignal, onMount} from "solid-js";
import {createStore} from "solid-js/store";

const HomePage = () => {
    const router = useRouter();

    let [peerData, setPeerData] = createStore({peerCount: 0}, {name: "peer-count-store"});
    let [leaving, setLeaving] = createSignal(false);
    let [filesList, setFilesList] = createStore([], {name: "files-list"});
    let [downloadCount, setDownloadCount] = createSignal(0);
    let [downloadsList, setDownloadsList] = createStore([], {name: "downloads-list"});
    let [uploadCount, setUploadCount] = createSignal(0);
    let [uploadsList, setUploadsList] = createStore([], {name: "uploads-list"});

    onMount(() => {
        send("peer-count");

        receive("started", (event, data) => {
            if (data.download) {
                setDownloadsList([...downloadsList.filter((download) => download.file.path !== data.key), {
                    key: data.key,
                    file: filesList.filter((f) => f.path === data.key)[0],
                    progress: 0,
                    speed: 0,
                    eta: 0
                }]);

                return setDownloadCount(downloadCount() + 1);
            }

            if (data.upload) {
                setUploadsList([...uploadsList.filter((upload) => upload.file.path !== data.key), {
                    file: filesList.filter((f) => f.path === data.key)[0],
                    key: data.key,
                    progress: 0,
                    speed: 0,
                    eta: 0
                }]);

                return setUploadCount(uploadCount() + 1);
            }
        });

        receive("progress", (event, data) => {
            if (data.download) {
                return setDownloadsList([...downloadsList.filter((download) => download.file.path !== data.key), {
                    key: data.key,
                    file: filesList.filter((f) => f.path === data.key)[0],
                    progress: data.download.progress,
                    speed: data.download.speed,
                    eta: data.download.eta
                }]);
            }

            if (data.upload) {
                return setUploadsList([...uploadsList.filter((upload) => upload.file.path !== data.key), {
                    key: data.key,
                    file: filesList.filter((f) => f.path === data.key)[0],
                    progress: data.upload.progress,
                    speed: data.upload.speed,
                    eta: data.upload.eta
                }]);
            }
        })

        receive("complete", (event, data) => {
            if (data.download) {
                setDownloadsList(downloadsList.filter((download) => download.file.path !== data.key));
                setFilesList(filesList.map((file) => {
                    if (file.path === data.key) return {...file, downloaded: true};
                    return file;
                }))

                return setDownloadCount(downloadCount() - 1);
            }

            if (data.upload) {
                setUploadsList(uploadsList.filter((upload) => upload.file.path !== data.key));

                return setUploadCount(uploadCount() - 1);
            }
        })

        receive("peer-count", (event, count) => {
            setPeerData({...peerData, peerCount: count});
        });

        receive("file-list", (event, data) => {
            let list = [];

            data.forEach((value) => list.push({...value, downloaded: false}));

            setFilesList(list)
        });
    })

    const disconnectSwarm = () => {
        send("disconnect-swarm");

        setLeaving(true);

        receive("swarm-disconnected", () => router.push("/"));
    }

    const addFile = () => {
        const inputElement = document.createElement("input");

        inputElement.setAttribute("type", "file");
        inputElement.click();

        inputElement.addEventListener("change", (event) => {
            const file = event.target.files[0];

            send("add-file", {name: file.name, path: file.path, size: file.size, type: file.type});
        });
    }

    const removeFile = (file) => {
        file = {name: file.name, path: file.path, size: file.size, type: file.type, remote: file.remote}

        send("remove-file", file);
    }

    const downloadFile = (path) => {
        send("download-file", path);
    }

    const deleteFile = (name) => {
        send("delete-file", name);

        receive("file-deleted", (event, data) => {
            setFilesList(filesList.map((file) => {
                if (file.name === data) return {...file, downloaded: false};
                return file;
            }))
        })
    }

    return (
        <div class={"flex flex-col w-full h-full overflow-hidden select-none"}>
            {leaving() && <div class={"flex flex-col w-full h-full justify-center items-center"}>
                <div class={"flex space-x-2 items-center"}>
                    <div>Leaving...</div>
                    <div class={"animate-spin w-5 h-5 border-l border-t border-green-500 border-1 rounded-full"}></div>
                </div>
            </div>}

            {!leaving() && <>
                <div class={"flex flex-col w-full h-auto"}>
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
                <div class={"relative flex flex-col w-full h-full"}>
                    {peerData.peerCount === 0 && (
                        <div class={"absolute w-full h-full flex flex-col justify-center items-center"}>
                            <div class={"w-full h-full bg-black opacity-20"}></div>
                            <div class={"absolute flex space-x-2 justify-center items-center w-full h-full"}>
                                <div>Waiting for a peer to join...</div>
                                <div
                                    class={"animate-spin w-5 h-5 border-l border-t border-green-500 border-1 rounded-full"}></div>
                            </div>
                        </div>
                    )}

                    <div class={"flex w-full h-3/5 border-b border-black"}>
                        <div class={"flex flex-col w-full h-full border-t border-gray-800"}>
                            <div class={"flex w-full border-b border-gray-800"}>
                                <div class={"flex w-full justify-between items-center p-2 border-b border-black"}>
                                    <div class={"flex items-center space-x-2"}>
                                        <div class={"text-md text-green-500 cursor-pointer"}
                                             onClick={() => addFile()}>
                                            Add File
                                        </div>
                                    </div>
                                    <div class={"flex items-center space-x-2"}>
                                        <div
                                            class={"flex items-center space-x-2 w-auto h-auto p-1 bg-green-500 bg-opacity-10 text-green-500 rounded-lg cursor-pointer"}
                                            title={"Downloads"}>
                                            <div>
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
                                                     viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                                </svg>
                                            </div>
                                            <div class={"text-sm"}>{downloadCount()}</div>
                                        </div>
                                        <div
                                            class={"flex items-center space-x-2 w-auto h-auto p-1 bg-green-500 bg-opacity-10 text-green-500 rounded-lg cursor-pointer"}
                                            title={"Uploads"}>
                                            <div>
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
                                                     viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                                                </svg>
                                            </div>
                                            <div class={"text-sm"}>{uploadCount()}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class={"flex flex-col space-y-2 p-2"}>
                                {filesList.map((file) => (
                                    <div
                                        class={"flex justify-between items-center border-b border-gray-800 p-2"}>
                                        <div>{file.name}</div>
                                        {file.remote ?
                                            file.downloaded ? (
                                                <div class={"flex items-center space-x-2"}>
                                                    <div
                                                        class={"flex items-center space-x-2 w-auto h-auto p-1 bg-green-500 bg-opacity-10 text-green-500 rounded-lg cursor-pointer"}
                                                        title={"View"}
                                                        onClick={() => send("view-downloads")}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4"
                                                             fill="none"
                                                             viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                                        </svg>
                                                    </div>
                                                    <div
                                                        class={"flex items-center space-x-2 w-auto h-auto p-1 bg-red-500 bg-opacity-10 text-red-500 rounded-lg cursor-pointer"}
                                                        title={"Delete"}
                                                        onClick={() => deleteFile(file.name)}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4"
                                                             fill="none"
                                                             viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                                        </svg>
                                                    </div>
                                                </div>

                                            ) : (
                                                <div
                                                    class={"flex items-center space-x-2 w-auto h-auto p-1 bg-green-500 bg-opacity-10 text-green-500 rounded-lg cursor-pointer"}
                                                    title={"Download"}
                                                    onClick={() => downloadFile(file.path)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
                                                         viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                                    </svg>
                                                </div>
                                            )
                                            :
                                            <div
                                                class={"flex items-center space-x-2 w-auto h-auto p-1 bg-red-500 bg-opacity-10 text-red-500 rounded-lg cursor-pointer"}
                                                title={"Delete"}
                                                onClick={() => removeFile(file)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
                                                     viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                                </svg>
                                            </div>
                                        }
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/*<div class={"w-2/5  h-full border-l border-gray-800"}>*/}
                        {/*    <div*/}
                        {/*        class={"flex flex-col w-full h-full border-l border-t border-t-gray-800 border-black"}></div>*/}
                        {/*</div>*/}
                    </div>

                    <div class={"flex w-full h-2/5"}>
                        <div class={"flex flex-col w-full h-full border-t border-t-gray-800"}>
                            <div class={"w-full h-auto border-b border-r border-gray-800"}>
                                <div
                                    class={"flex items-center w-full h-auto p-2 border-b border-black text-green-500"}>Downloads
                                </div>
                            </div>
                            <div class={"w-full h-full border-r border-gray-800 p-2 pb-12"}>
                                <div class={"w-full h-full overflow-y-auto"}>
                                    {downloadsList.map((download) => (
                                        <div class={"flex flex-col space-y-2 p-2 border-b border-gray-800"}>
                                            <div class={"flex justify-between items-center"}>
                                                <div>{download.file.name}</div>
                                                <div class={"flex items-center space-x-2"}>
                                                    <div>{download.eta} s</div>
                                                    <div>{download.speed} b/s</div>
                                                </div>
                                            </div>
                                            <div class={"w-full h-2 rounded-full bg-gray-800"}>
                                                <div style={{width: download.progress + "%"}}
                                                     class={`h-full rounded-full bg-green-500`}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div class={"flex flex-col w-full h-full border-t border-t-gray-800"}>
                            <div class={"w-full h-auto border-b border-gray-800 border-l border-l-black"}>
                                <div
                                    class={"flex items-center w-full h-auto p-2 border-b border-black text-green-500"}>Uploads
                                </div>
                            </div>
                            <div class={"w-full h-full border-l border-black p-2 pb-12"}>
                                <div class={"w-full h-full overflow-y-auto"}>
                                    {downloadsList.map((download) => (
                                        <div class={"flex flex-col space-y-2 p-2 border-b border-gray-800"}>
                                            <div class={"flex justify-between items-center"}>
                                                <div>{download.file.name}</div>
                                                <div class={"flex items-center space-x-2"}>
                                                    <div>{download.eta} s</div>
                                                    <div>{download.speed} b/s</div>
                                                </div>
                                            </div>
                                            <div class={"w-full h-2 rounded-full bg-gray-800"}>
                                                <div style={{width: download.progress + "%"}}
                                                     class={`h-full rounded-full bg-green-500`}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>}
        </div>
    )
};

export default HomePage;