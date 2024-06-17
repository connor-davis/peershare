import { create } from 'zustand'

const useUploadDownloadProgress = create((set) => ({
  uploads: {},
  downloads: {},
  addDownload: (fileName) =>
    set((state) => {
      state.downloads[fileName] = {
        fileName
      }

      return { ...state }
    }),
  updateDownload: (fileName, progress) =>
    set((state) => {
      if (!state.downloads[fileName]['progress']) {
        state.downloads[fileName] = { ...state.downloads[fileName], progress }
      } else {
        state.downloads[fileName]['progress'] = progress
      }

      return { ...state }
    }),
  removeDownload: (fileName) =>
    set((state) => {
      delete state.downloads[fileName]

      return { ...state }
    }),
  addUpload: (fileName) =>
    set((state) => {
      state.uploads[fileName] = {
        fileName
      }

      return { ...state }
    }),
  updateUpload: (fileName, progress) =>
    set((state) => {
      if (!state.uploads[fileName]['progress']) {
        state.uploads[fileName] = { ...state.uploads[fileName], progress }
      } else {
        state.uploads[fileName]['progress'] = progress
      }

      return { ...state }
    }),
  removeUpload: (fileName) =>
    set((state) => {
      delete state.uploads[fileName]

      return { ...state }
    })
}))

export default useUploadDownloadProgress
