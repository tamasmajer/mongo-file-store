class TreeFs {

    constructor(files) {
        this.files = files
        this.current = ""
        this.map = TreeFs.toFolders(files)
    }

    static toFolders(files) {
        const folders = {}
        files.forEach(file => {
            TreeFs.addParents(file.filename, folders)
            folders[file.filename] = file
        })
        return folders
    }

    static getParent(file) {
        const ix = file.lastIndexOf('/')
        return file.substring(0, ix)
    }

    static addParents(file, map) {
        const parent = TreeFs.getParent(file)
        if (parent.length > 0) {
            if (!map[parent + "/"]) map[parent + "/"] = {filename: parent + "/", isFolder: true}
            TreeFs.addParents(parent, map)
        }
    }

    md(relative) {
        if (relative === '') return
        if (relative.endsWith("/")) relative = relative.substring(0, relative.length - 1)
        const path = this.current + relative
        TreeFs.addParents(path, this.map)
        if (!this.map[path + "/"]) this.map[path + "/"] = {filename: path + "/", isFolder: true}
        this.cd(relative)
    }

    pwd() {
        return this.current
    }

    cd(folder) {
        if (folder === '/') return this.current = ''
        if (folder.endsWith('/')) folder = folder.substring(0, folder.length - 1)
        if (folder === '.') return this.current
        if (folder === '..') {
            if (this.current === '') return this.current
            else return this.current = TreeFs.getParent(folder)
        }
        const newFolder = this.current + folder + "/"
        if (!this.map[newFolder] || !this.map[newFolder].isFolder)
            throw new Error("" + newFolder + ": No such file or directory")
        return this.current = newFolder
    }

    getPath(path) {
        const entry = this.map[path]
        return entry ? TreeFs.getData(entry) : null
    }

    getFile(relative) {
        const entry = this.map[this.current + relative]
        return entry ? TreeFs.getData(entry) : null
    }

    getFiles(relative) {
        return Object.keys(this.map).filter(key => {
            return !this.map[key].isFolder && key.startsWith(this.current + (relative || ''))
        }).map(key => TreeFs.getData(this.map[key]))
    }

    getContents(relative) {
        return Object.keys(this.map).filter(key => {
            const prefix = this.current + (relative || '')
            return key.length > prefix.length && key.startsWith(prefix)
        }).map(key => TreeFs.getData(this.map[key]))
    }

    ls() {
        return Object.keys(this.map).filter(key => {
            const next = key.indexOf('/', this.current.length + 1)
            return key !== this.current && key.startsWith(this.current) && ( next < 0 || next === key.length - 1 )
        }).map(key => TreeFs.getData(this.map[key]))
    }

    static getData(entry) {
        return {
            path: entry.filename,
            id: entry._id,
            name: entry.isFolder ? TreeFs.getFolderName(entry.filename) : TreeFs.getName(entry.filename),
            folder: entry.isFolder,
            size: entry.length,
            date: entry.uploadDate,
            md5: entry.md5
        }
    }

    static getName(file) {
        const ix = file.lastIndexOf('/')
        return ix < 0 ? file : file.substring(ix + 1)
    }

    static getFolderName(file) {
        if (file[file.length - 1] !== '/') return null
        const ix = file.lastIndexOf('/', file.length - 2)
        return ix < 0 ? file : file.substring(ix + 1)
    }
}

module.exports = TreeFs

