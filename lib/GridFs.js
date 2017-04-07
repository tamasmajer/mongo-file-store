const {MongoClient, GridStore} = require('mongodb')


class GridFs {

    constructor(dbUri) {
        this.dbUri = dbUri
    }

    async connect() {
        this.db = await MongoClient.connect(this.dbUri)
    }

    disconnect() {
        if (this.db) this.db.close()
    }

    async saveTextFile(fileName, text) {
        return await this.saveFile(fileName, Buffer.from(text, 'utf8'))
    }

    async saveFile(fileName, buffer) {
        const file = new GridStore(this.db, fileName, 'w')
        await file.open()
        await file.write(buffer)
        const result = await file.close()
        return result._id
    }

    async loadFile(fileName) {
        return await GridStore.read(this.db, fileName)
    }

    async loadTextFile(fileName) {
        const buffer = await this.loadFile(fileName)
        return buffer.toString('utf8')
    }

    async listFiles() {
        return await this.db.collection("fs.files").find({}).toArray()
    }

    async delete(fileName) {
        await GridStore.unlink(this.db, fileName)
    }
}


module.exports = GridFs



