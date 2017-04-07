const readline = require('readline')
const Servers = require('./Servers')
const Commands = require('./Commands')

class Cli {

    constructor(servers = Servers.loadFile()) {
        this.servers = servers
    }

    async connect(dbName) {
        this.dbName = null
        if (!dbName) {
            dbName = this.servers.getFirstServer()
        }
        this.commands = await this.servers.createCommands(this.servers.getUri(dbName))
        // console.log("commands=",this.commands,!!this.commands)
        if (this.commands) {
            this.dbName = dbName
            console.log("connected: " + this.dbName)
        }
        else {
            if (dbName) console.log("could not connect to: " + dbName)
        }
    }

    async start(server) {
        await this.connect(server)
        this.readline = readline.createInterface(process.stdin, process.stdout)
        this.readline.setPrompt('' + (this.dbName||'') + '> ')
        this.readline.prompt()
        this.readline.on('line', line => this.processInput(line))
        this.readline.on('close', () => process.exit(0))
    }

    async processInput(line) {
        const parts = line.split(' ')
        const cmd = parts[0]
        try {
            if (cmd === "exit") this.readline.close()
            else if (cmd === "connect" && parts.length <= 3) {
                const help = parts.length === 1
                if (help) {
                    const text = this.servers.print()
                    console.log("List of mongo servers:")
                    console.log(text||"(add a server)")
                }
                else {
                    const first = parts[1]
                    const second = parts[2]
                    const save = parts.length === 3
                    const already = parts.length === 2 ? this.servers.getUri(first) : null
                    const dbUri = parts.length === 2 ? (already || first) : second
                    this.commands = await this.servers.createCommands(dbUri)
                    if (this.commands) {
                        if (save || already) this.servers.save(first, dbUri)
                        this.dbName = (already || save) ? first : "server"
                    }
                    else {
                        console.log("could not connect.")
                    }
                }
            }
            else if (cmd === "disconnect" && parts.length <= 2 && this.dbName) {
                const remove = parts.length === 2
                if (remove) {
                    const ok = this.servers.remove(this.dbName)
                    if (ok) console.log("removed: " + this.dbName + " " + this.commands.connection.dbUri)
                    else console.log("was not saved: " + this.dbName)
                }
                this.commands = null
                this.dbName = null
            }
            else if (!this.commands) {
                console.log(Commands.HELP_CONNECT)
            }
            else if (Commands.COMMANDS.includes(cmd)) {
                await this.commands[cmd](parts)
            }
            else {
                console.log("\n Commands:\n\n  " + Commands.HELP.join("\n  ") + "\n")
            }
        }
        catch (err) {
            console.log("" + err.message)
        }
        this.readline.setPrompt('' + (this.dbName||'') + '> ')
        this.readline.prompt()
    }
}


module.exports = Cli