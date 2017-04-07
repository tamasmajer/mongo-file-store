const LocalFs = require('./LocalFs')
const Connection = require('./Connection')
const Commands = require('./Commands')
const FILE = 'mongo-file-store.txt'

class Servers {

    constructor(dbNameUriMap = {}) {
        this.mongos = dbNameUriMap
    }

    static loadFile(file = FILE) {
        const mongos = {}
        try {
            const text = LocalFs.loadTextFile(file)
            const lines = text.split("\n").filter(line => line.trim().length > 0 && line.indexOf("=") >= 0)
            lines.forEach(line => {
                const ix = line.indexOf("=")
                const dbName = line.substring(0, ix).trim()
                const dbUri = line.substring(ix + 1).trim()
                if (dbName.indexOf(" ") >= 0 || dbUri.indexOf(" ") >= 0) return
                mongos[dbName] = dbUri
            })
        } catch (e) {
        }
        return new Servers(mongos)
    }

    saveFile(file = FILE) {
        try {
            const text = this.print()
            LocalFs.saveFile(file, text)
        }
        catch (e) {
            console.log("Could not save: " + FILE, e)
        }
    }

    print() {
        const lines = []
        for (const dbName in this.mongos) {
            const dbUri = this.mongos[dbName]
            lines.push(dbName + " = " + dbUri)
        }
        return lines.join("\n")
    }

    hasAny() {
        return Object.keys(this.mongos).length
    }

    remove(dbName, file = undefined) {
        const had = this.mongos[dbName]
        delete this.mongos[dbName]
        this.saveFile(file)
        return had
    }

    save(dbName, dbUri, file = undefined) {
        const newOrder = {}
        if (this.mongos[dbName]) newOrder[dbName] = dbUri
        for (const key in this.mongos) {
            if (key !== dbName) newOrder[key] = this.mongos[key]
        }
        this.mongos = newOrder
        this.saveFile(file)
    }

    getFirstServer() {
        let dbName = null
        const dbNames = Object.keys(this.mongos)
        if (dbNames.length > 0) {
            dbName = dbNames[0]
        }
        return dbName
    }

    getUri(dbName) {
        return this.mongos[dbName] || null
    }

    async createCommands(dbUri) {
        if (!dbUri) return null
        let commands = null
        try {
            const connection = new Connection(dbUri)
            const ok = await connection.scan()
            if (ok) commands = new Commands(connection)
        }
        catch (e) {
            console.log("err:", e)
        }
        return commands
    }

}


module.exports = Servers