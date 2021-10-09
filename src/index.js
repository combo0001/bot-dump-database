const { Client, Intents } = require('discord.js')
const fs = require('fs')
const dump = require('mysqldump')
const config = require('./config/config.json')
const app = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })

async function executeDump(){
    if(!config.dump || typeof config.dump != 'object' || !config.dump.host  || !config.dump.database || !config.dump.user){
        console.error('[SERVER] Algo deu errado, você definiu de forma incorreta sua config.json')
        return
    }
    const date = new Date()
    const folder = './cache'
    const fileName = `dump-${date.getDate() < 10 ? '0'+date.getDate() : date.getDate()}-${(date.getMonth() + 1) < 10 ? '0'+(date.getMonth() + 1) : date.getMonth() + 1}-${date.getFullYear()}_${date.getHours() < 10 ? '0'+date.getHours() : date.getHours()}-${date.getMinutes() < 10 ? '0'+date.getMinutes() : date.getMinutes()}-${date.getSeconds() < 10 ? '0'+date.getSeconds() : date.getSeconds()}.sql`
    const fileDir = `${folder}/${fileName}`
    if (!fs.existsSync(folder)){
        fs.mkdirSync(folder)
    }
    await dump({
        connection: {
            host: config.dump.host,
            user: config.dump.user,
            password: config.dump.password,
            database: config.dump.database,
        },
        dumpToFile: fileDir,
    }).catch(() => {})
    if (!fs.existsSync(fileDir)){
        return false
    }
    return fileDir
}

async function taskDump(){
    if(!config.dump || typeof config.dump != 'object' || !config.dump.channelId || !config.dump.database){
        console.error('[SERVER] Algo deu errado, você definiu de forma incorreta sua config.json')
        return
    } 
    const fileDir = await executeDump()
    if(fileDir){
        const channelDump = await app.channels.fetch(config.dump.channelId).catch(() => {})
        const send = await channelDump.send({
            content: '```ini\n[DATABASE '+config.dump.database.toUpperCase()+']: DUMP AUTOMÁTICO\n[DATA]: '+String(new Date())+' ```',
            files: [fileDir]
        }).catch(() => {})
    }
    setTimeout(taskDump, (config.dump.cooldown || 10) * 60 * 1000)
}


app.login(config.token).then(err => {
    if(!err)return
    console.log(`[SERVER] Iniciado em ${app.guilds.cache.size} servidores.`)

    setTimeout(taskDump, (config.dump.cooldown || 10) * 60 * 1000)
})