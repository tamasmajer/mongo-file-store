const LocalFs = require("./LocalFs")


class Commands {

    static get HELP_CONNECT() {
        return "connect <optional_mongo_db_nick_name> <optional_mongo_db_URI_with_password>\n    - Connects to a mongo db.\n    - Saves the name URI pair into the mongo-file-store.txt file.\n    - If already saved it is enough to provide the name.\n    - If you don't want to save the server provide only the URI.\n    - To list all servers call it without parameters."
    }
    static get HELP() {
        return [
            "ls - Lists files and folders.",
            "tree - Lists recursively files and folders.",
            "find - Lists recursively all file paths.",
            "cd - Changes directory.",
            "pwd - Prints working directory.",
            "md <remote_path> - Makes directories and step into it.",
            "cat - Prints remote file to console.",
            "rm <remote_file_or_dir> - Removes a relative file or folder.",
            "clear - Removes all contents from current remote directory.",
            "up <from_local_dir> - Uploads local directory into the empty server folder.",
            "down <into_local_dir> - Downloads server folder into a new local directory.",
            Commands.HELP_CONNECT,
            "disconnect <optional_mongo_db_nick_name>\n    - Disconnects from the current mongo db.\n    - If you provide a name, it will be removed from the mongo-file-store.txt file.",
            "exit - Exits from this tool."
        ]
    }

    static get COMMANDS() {
        const help = Commands.HELP
        return help.map(line => {
            const ix = line.indexOf(" ")
            return ix > 0 ? line.substring(0, ix) : line
        })
    }

    constructor(connection) {
        this.connection = connection
    }


    async tree(parts) {
        const {treeFs}=this.connection
        if (parts.length > 1) throw new Error("Extra parameters are not supported.")
        const list = treeFs.getContents()
        list.sort((a, b) => {
            const depthA = a.path.split("").filter(c => c === '/').length
            const depthB = b.path.split("").filter(c => c === '/').length
            const lowDepthFirst = depthA - depthB
            if (lowDepthFirst !== 0) return lowDepthFirst
            return a.path.toLowerCase().localeCompare(b.path.toLowerCase())
        })
        const list2 = list.map(item => {
            const ix = item.path.lastIndexOf('/', item.path.length - 2)
            const start = item.path.substring(0, ix + 1)
            const prefix = start.split("").filter(c => c === '/').join("")
            const pre = prefix.replace(/\//g, '   ')
            return "" + pre + "" + (item.folder ? "" : "") + "└─ " + item.path.substring(ix + 1)
        })
        console.log(list2.join("\n"))
    }

    async find(parts) {
        const {treeFs}=this.connection
        if (parts.length > 1) throw new Error("Extra parameters are not supported.")
        const list = treeFs.getFiles()
        list.sort((a, b) => {
            const depthA = a.path.split("").filter(c => c === '/').length
            const depthB = b.path.split("").filter(c => c === '/').length
            const lowDepthFirst = depthA - depthB
            if (lowDepthFirst !== 0) return lowDepthFirst
            return a.path.toLowerCase().localeCompare(b.path.toLowerCase())
        })
        const list2 = list.map(item => item.path)
        console.log(list2.join("\n"))
    }

    async ls(parts) {
        const {treeFs}=this.connection
        if (parts.length > 1) throw new Error("Extra parameters are not supported.")
        const list = treeFs.ls()
        list.sort((a, b) => {
            const depthA = a.path.split("").filter(c => c === '/').length
            const depthB = b.path.split("").filter(c => c === '/').length
            const lowDepthFirst = depthA - depthB
            if (lowDepthFirst !== 0) return lowDepthFirst
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        })
        const list2 = list.map(item => item.name)
        console.log("" + list2.join("  "))
    }

    async pwd(parts) {
        const {treeFs}=this.connection
        let at = treeFs.pwd()
        console.log("at: " + (at || "/"))
    }

    async cd(parts) {
        const {treeFs}=this.connection
        treeFs.cd(parts[1])
    }

    async cat(parts) {
        const {treeFs, loadFile}=this.connection
        const path = treeFs.pwd() + parts[1]
        const entry = treeFs.getPath(path)
        if (entry) {
            const text = await loadFile(path)
            console.log(text)
        }
    }

    async down(parts) {
        const {treeFs, loadFile}=this.connection
        if (!parts[1]) throw new Error("Define a new local directory.\n" + listDir(".").join("  "))
        const into = parts[1]
        if (!into) throw new Error("Define a new local directory.\n" + listDir(".").join("  "))
        const exists = LocalFs.exists("./" + into)
        if (exists) throw new Error("Local directory already exists")
        const files = treeFs.getFiles()
        for (const file of files) {
            const text = await loadFile(file.path)
            const to = file.path.substring(treeFs.pwd().length)
            const path = "./" + into + "/" + to
            console.log("saving: " + file.path)
            LocalFs.saveFile(path, text)
        }
    }

    async clear(parts) {
        const {treeFs, deleteAll, updateTree}=this.connection
        if (parts[1]) throw new Error("Extra parameters not supported")
        const pwd = treeFs.pwd()
        const files = treeFs.getFiles()
        const paths = files.map(entry => entry.path)
        await deleteAll(paths)
        await updateTree(pwd)
    }

    async rm(parts) {
        const {treeFs, deleteAll, updateTree}=this.connection
        if (!parts[1]) throw new Error("Select a remote file or directory.")
        const ref = parts[1]
        const entry = treeFs.getFile(ref)
        if (!entry) throw new Error("File or directory doesn't exists: " + ref)
        const pwd = treeFs.pwd()
        let toRemove
        if (entry.folder) {
            const files = treeFs.getFiles(ref)
            toRemove = files.map(entry => entry.path)
        }
        else {
            toRemove = [entry.path]
        }
        await deleteAll(toRemove)
        await updateTree(pwd)
    }

    async md(parts) {
        const {treeFs}=this.connection
        const relative = parts[1]
        if (!relative) throw new Error("Define a directory name.")
        treeFs.md(relative)
        console.log("at: " + treeFs.pwd())
    }

    async up(parts) {
        const {treeFs, save, updateTree}=this.connection
        const already = treeFs.getFiles()
        if (already.length > 0)
            throw new Error("Remote directory is not empty:\n" + already.map(file => file.path).join("  "))
        const from = parts[1]
        if (!from) throw new Error("Select a local file or directory:\n" + listDir(".").join("  "))
        const exists = LocalFs.exists("./" + from)
        if (!exists) throw new Error("Local file or directory doesn't exists:\n" + listDir(".").join("  "))
        const files = LocalFs.listFiles("./" + from)
        for (const file of files) {
            const buffer = LocalFs.readFile(file)
            const rel = file.substring(("./" + from + "/").length)
            const path = treeFs.pwd() + rel
            console.log("uploading: " + path)
            await save(path, buffer)
        }
        const pwd = treeFs.pwd()
        await updateTree(pwd)
    }

}


module.exports = Commands