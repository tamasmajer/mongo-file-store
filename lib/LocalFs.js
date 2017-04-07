const fs = require('fs')


class LocalFs {

    static loadTextFile(path) {
        const buffer = this.loadFile(path)
        return buffer.toString('utf8')
    }

    static loadFile(path) {
        return fs.readFileSync(path)
    }

    static saveFile(path, text) {
        LocalFs.mkdirs(path)
        fs.writeFileSync(path, text)
    }

    static exists(path) {
        return fs.existsSync(path)
    }

    static listFiles(path) {
        if (!path.endsWith("/")) path += "/"
        const list = fs.readdirSync(path)
        const files = []
        list.forEach(file => {
            const path = path + file
            const isDir = fs.lstatSync(path).isDirectory()
            if (isDir) files.push(...LocalFs.listFiles(path))
            else files.push(path)
        })
        return files
    }

    static listDir(dir) {
        const list = fs.readdirSync(dir)
        const files = []
        list.forEach(file => {
            const path = dir + "/" + file
            const isDir = fs.lstatSync(path).isDirectory()
            if (isDir) files.push(file + "/")
            else files.push(file)
        })
        return files
    }

    static getParent(file) {
        const ix = file.lastIndexOf('/')
        return file.substring(0, ix)
    }

    static mkdirs(path) {
        const folder = LocalFs.getParent(path)
        if (!folder || folder == '.') return
        LocalFs.mkdirs(folder)
        try {
            fs.mkdirSync(folder)
        }
        catch (e) {
        }
    }

}


module.exports = LocalFs