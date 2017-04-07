const GridFs = require('./GridFs')
const TreeFs = require('./TreeFs')


class Connection {

    constructor(dbUri) {
        this.dbUri = dbUri
        this.treeFs = null
    }

    async scan() {
        const gridFs = new GridFs(this.dbUri)
        let files = null
        try {
            await gridFs.connect()
            files = await gridFs.listFiles()
        } catch (err) {
        }
        gridFs.disconnect()
        this.treeFs = files ? new TreeFs(files) : null
        return !!this.treeFs
    }

    async loadFile(file) {
        const gridFs = new GridFs(this.dbUri)
        let text = null
        try {
            await gridFs.connect()
            text = await gridFs.loadTextFile(file)
        } catch (err) {
            console.log(err)
        }
        gridFs.disconnect()
        return text
    }

    async saveFile(file, buffer) {
        const gridFs = new GridFs(this.dbUri)
        let text = null
        try {
            await gridFs.connect()
            text = await gridFs.saveFile(file, buffer)
        } catch (err) {
            console.log(err)
        }
        gridFs.disconnect()
        return text
    }

    async deleteAll(files) {
        const gridFs = new GridFs(this.dbUri)
        try {
            await gridFs.connect()
            for (const file of files) {
                console.log("deleting: " + file)
                await gridFs.delete(file)
            }
        } catch (err) {
            console.log(err)
        }
        gridFs.disconnect()
    }

    async updateTree(newPwd) {
        this.treeFs = await this.scan()
        this.treeFs.md(newPwd)
    }

}


module.exports = Connection