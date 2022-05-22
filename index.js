const Discord = require("discord.js");
const fs = require("fs");
const http = require('http');
const express = require('express');
const config = require('./config.json')
const licenses = require('./database/users.json')
const driscord = require('./database/discord.json')
const guidbl = require('./database/gblacklist.json')

const Client = class extends Discord.Client {
  constructor(config) {
    super({
      intents: [Discord.Intents.FLAGS.GUILD_VOICE_STATES, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILDS],
    });

    this.commands = new Discord.Collection();

    this.config = config;
  }
};

const client = new Client({
	makeCache: manager => {
		if (manager.name === 'MessageManager') return new LimitedCollection({ maxSize: 0 });
		return new Collection();
	},
});

client.config = config;

var resets = {}
var unbl = {}
var genlcs = {}
var lcsinfo = {}
var dellcs = {}

function resetip(message){
  if(driscord[String(message.author.id)].includes(message.content)){
    var embed = new Discord.MessageEmbed()
    .setTitle(`Log Resets`)
    .setColor('#2F3136')
    .addField("Product: ","``"+licenses[message.content].product+"``")
    .addField("Cliente: ","<@!"+licenses[message.content].owner+">")
    .addField("License: ","``"+message.content+"``")
    .addField("IP: ","``"+licenses[message.content].ip+"``")
    .addField("HWID: ","``"+licenses[message.content].hwid+"``")
    .setTimestamp(new Date())
    .setFooter("Storm")
    licenses[message.content].ip = "standby"
    licenses[message.content].hwid = "standby"
    update("database/users.json", licenses)
    resets[String(message.author.id)] = null
    client.channels.cache.get(config.logresets).send({ embeds: [embed] })
    return "IP reset successfully, new IP will be configured automatically when authenticated!"
  }else{
    resets[String(message.author.id)] = null
    return "License not found/does not belong to you!"
  }
}

function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {result += characters.charAt(Math.floor(Math.random() * charactersLength));}
  return result;
}

function generatelcs(message){
  var args = message.content.trim().split(/ +/g);
  if (args[0] == null || args[1] == null)
  return message.channel.send({content:"<@user> <product> <days (optional)>", ephemeral: true})
  var person = message.mentions.members.first()
  if(person == null)
  return message.channel.send({content:"Failed to search for user !", ephemeral: true})
  person = person.user.id
  var expiration = "Never"
  key = makeid(50)
  licenses[key] = {}
  licenses[key].product = args[1]
  licenses[key].ip = "standby"
  licenses[key].hwid = "standby"
  licenses[key].owner = person
  if(args[2] != null ){
    licenses[key].expire = true
    licenses[key].days = args[2];
    licenses[key].date = Math.floor(new Date().getTime() / 1000);
    expiration = args[2] + " days"
  }
  var licensesarr = driscord[message.mentions.members.first().user.id]
  if (licensesarr == null)
  licensesarr=[]
  licensesarr.push(key)
  driscord[message.mentions.members.first().user.id] = licensesarr
  update("database/users.json", licenses)
  update("database/discord.json", driscord)
  var embed = new Discord.MessageEmbed()
  .setTitle(`New Product\n`)
  .addField(`User: `, `<@!${person}>`)
  .addField(`License: `, "``"+key+"``")
  .addField(`Product: `, "``"+args[1]+"``")
  .addField(`Expires: `, "``"+expiration+"``")
  .setColor('#2F3136')
  message.mentions.members.first().send({embeds: [embed]});
  genlcs[String(message.author.id)] = false
  message.channel.send({content:"Key sent in client's private !", ephemeral: true})
}

function unblacklisthw(message){
  var args = message.content.trim().split(/ +/g);
  if (args[0] == null)
  return message.channel.send("Enter below: HWID");
  guidbl[args] = null 
  update("database/gblacklist.json", guidbl)
  unbl[String(message.author.id)] = false
  return message.channel.send("HWID removed from blacklist !")
}

function deletelicense(message){
  var args = message.content
  if (licenses[args] == null)
  return message.channel.send({content:"License not found!"})
  licenses[args].product = null 
  update("database/users.json", licenses)
  dellcs[String(message.author.id)] = null
  return message.channel.send("License has been deleted !")
}

function getlicenseinfo(message){
  var keys = licenses
  lcsinfo[String(message.author.id)] = null
  var k = message.content
  if (licenses[k] == null || licenses[k].product == null)
  return message.channel.send({content: "License not found"});
  
  var expires = "Never"
  if (keys[k].expire == true){
      var days = calcdays(keys[k].date,keys[k].days)
      if (days < 0)
      expires = " Expired"
      else
      expires = days + " days"
  }
  keyip = keys[k].ip
  if (keyip == "standby")
  keyip = " "

  keyhw = keys[k].hwid
  if (keyhw == "standby")
  keyhw = " "

  var embed = new Discord.MessageEmbed()
  .setTitle(`License Information\n`)
  .addField(`User: `, `<@!${keys[k].owner}>`)
  .addField(`License: `, "``"+k+"``")
  .addField(`Product: `, "``"+keys[k].product+"``")
  .addField(`Expires: `, "``"+expires+"``")
  .addField(`IP: `, "``"+keyip+"``")
  .addField(`HWID: `, "``"+keyhw+"``")
  .setColor('#2F3136')
  message.channel.send({embeds: [embed]});
}

client.on('message', (message) => {
  if (message.author.bot) return;

  if (message.channelId == config.integrations){
    if (resets[String(message.author.id)] == true){
      message.author.send({content:resetip(message), ephemeral: true})
      return message.delete()
    }else{
      return message.delete()
    }
  }else

  if (message.channelId == config.admintegrations){
    if (unbl[String(message.author.id)] == true){
      unblacklisthw(message)
      return message.delete()
    }else if (genlcs[String(message.author.id)] == true){
      if (message.content != null)
      generatelcs(message)

      return message.delete()
    }else if (lcsinfo[String(message.author.id)] == true){
      getlicenseinfo(message)
      return message.delete()
    }else if (dellcs[String(message.author.id)] == true){
      deletelicense(message)
      return message.delete()
    } else{
      return message.delete()
    }
  }
});

function pad2(n) {
  return (n < 10 ? '0' : '') + n;
}

function calcdays(n,s) {
  let unix_timestamp = n;
  var date = new Date(unix_timestamp * 1000);
  var month = pad2(date.getMonth()+1);
  var day = pad2(date.getDate());
  var year= date.getFullYear();
  const startDate  = year + '-' + month + '-' + day;
  const endDate    = new Date().toISOString().slice(0, 10);
  const diffInMs   = new Date(startDate) - new Date(endDate);
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24) ;
  let ret = parseInt(diffInDays) + parseInt(s);
  return ret
}

client.on('interactionCreate', async interaction => {
  if(interaction.customId == "resetdevice"){
    var combo = []
    var keys = licenses
    driscord[String(interaction.user.id)].forEach(function(k) {
      var expires = "Never"
      if (keys[k].expire == true){
        var days = calcdays(keys[k].date,keys[k].days)
        expires = days + " days"
      }
      keyip = keys[k].ip
      if (keyip == "standby")
      keyip = ""

      keyhw = keys[k].hwid
      if (keyhw == "standby")
      keyhw = ""

      if ((days == null || days > 0) && keys[k].product != null){

        var currlicense = {
          label: 'Product: '+keys[k].product,
          description: 'Current IP: '+keyip+', License: '+k,
          value: k,
        }
        combo.push(currlicense)
      }
    })
    const row = new Discord.MessageActionRow().addComponents(
      new Discord.MessageSelectMenu()
      .setCustomId('lcsreseter')
      .setPlaceholder('Select the license you want to reset')
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(combo),
    );
		await interaction.reply({ content: '  ', components: [row], ephemeral: true });
	}
  if(interaction.customId == "lcsreseter"){
    interaction.values.forEach(function(val) {
      if(licenses[val].ip != "standby" || licenses[val].hwid != "standby"){
        var embed = new Discord.MessageEmbed()
        .setTitle(`Log Resets`)
        .setColor('#2F3136')
        .addField("Product: ","``"+licenses[val].product+"``")
        .addField("Cliente: ","<@!"+interaction.user.id+">")
        .addField("License: ","``"+val+"``")
        .addField("IP: ","``"+licenses[val].ip+"``")
        .addField("HWID: ","``"+licenses[val].hwid+"``")
        .setTimestamp(new Date())
        .setFooter("Storm")
        licenses[val].ip = "standby"
        licenses[val].hwid = "standby"
        update("database/users.json", licenses)
        client.channels.cache.get(config.logresets).send({ embeds: [embed] })
        interaction.reply({ content: 'License devices id has been reseted !', ephemeral: true });
      }else{
        interaction.reply({ content: 'This license is already reseted !', ephemeral: true });
      }
    })
  }
});

client.on('interactionCreate', async (button) => {
  if (!button.isButton()) return;
  if(button.customId == "getinfos"){
    if(driscord[String(button.user.id)] == null)
    return button.reply({content: "You don't have any license !", ephemeral: true});
    var products = ""
    var keys = licenses
    driscord[String(button.user.id)].forEach(function(k) {
        var expires = "Never"
        if (keys[k].expire == true){
          var days = calcdays(keys[k].date,keys[k].days)
          expires = days + " days"
        }
        keyip = keys[k].ip
        if (keyip == "standby")
        keyip = ""

        keyhw = keys[k].hwid
        if (keyhw == "standby")
        keyhw = ""

        if ((days == null || days > 0) && keys[k].product != null)
        products = products + "```Product: "+keys[k].product+"\nLicense: "+k+"\nIP: "+keyip+"\nHWID: "+keyhw+"\nExpires:"+expires+"```"
    })

  if(products == "")
    products = "All your licenses are expired"
    var embed = new Discord.MessageEmbed()
    .setTitle("Your Products")
    .setDescription(products)
    .setColor('#2F3136')
    button.reply({ embeds: [embed], ephemeral: true});
  }else if(button.customId == "unblacklisthw"){
    unbl[String(button.user.id)] = true 
    button.reply({ content:"Enter below: HWID", ephemeral: true});
  }else if(button.customId == "getlicenseinfo"){
    lcsinfo[String(button.user.id)] = true 
    button.reply({ content:"Enter below: License", ephemeral: true});
  }else if(button.customId == "genlicense"){
    genlcs[String(button.user.id)] = true 
    button.reply({ content:"Enter below: <@user> <product> <days (optional)>", ephemeral: true});
  } else if(button.customId == "deletelicense"){
    dellcs[String(button.user.id)] = true 
    button.reply({ content:"Enter below: License", ephemeral: true});
  }
})

function asyncintegrations(){
  client.channels.cache.get(config.integrations).bulkDelete(100).catch(() => console.error)
  client.channels.cache.get(config.admintegrations).bulkDelete(100).catch(() => console.error)
  resets = {}
  unbl = {}
  genlcs = {}
  const row = new Discord.MessageActionRow().addComponents(
    new Discord.MessageButton()
    .setCustomId('resetdevice')
    .setLabel('RESET LICENSE DEVICE')
    .setStyle('SUCCESS'),
    new Discord.MessageButton()
    .setCustomId('getinfos')
    .setLabel('GET YOUR LICENSES')
    .setStyle('SUCCESS'),
  );
  client.channels.cache.get(config.integrations).send({ content: ' ', components: [row]})
  const row2 = new Discord.MessageActionRow().addComponents(
    new Discord.MessageButton()
    .setCustomId('getlicenseinfo')
    .setLabel('GET LICENSE INFO')
    .setStyle('SUCCESS'),
    new Discord.MessageButton()
    .setCustomId('genlicense')
    .setLabel('GENERATE LICENSE')
    .setStyle('SUCCESS'),
    new Discord.MessageButton()
    .setCustomId('unblacklisthw')
    .setLabel('UNBLACKLIST HWID')
    .setStyle('DANGER'),
    new Discord.MessageButton()
    .setCustomId('deletelicense')
    .setLabel('DELETE LICENSE')
    .setStyle('DANGER'),
  );
  client.channels.cache.get(config.admintegrations).send({ content: ' ', components: [row2]})
  console.clear()
  console.log("Bot e HTTP Server estao ONLINE!")
}

client.on("ready", () => {
  console.log("Bot e HTTP Server estao ONLINE!")
  client.user.setStatus("online")
  asyncintegrations()
  setInterval(() => {
    asyncintegrations()
  }, 3*60*1000)
});

function getnewtoken(){
  var n = new Date(new Date().toUTCString())
  var calc = Math.floor(n/1000)
  var time = Math.floor(calc * 237356)
  console.log(calc)
  return Buffer(JSON.stringify(time, null, 2)).toString('base64');
}


function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

function parseseconds(utc){
  var n = new Date(new Date().toUTCString())
  var calc = Math.floor(n/1000) - utc
  if(calc == 0 || calc > -50 && calc < 50){
    return true
  }else{
   return false
  }
}

const app = express();

app.get('/api/pedrin/authenticate', function(req, res){
  var ua = req.headers['user-agent']
  if (ua == "Microsoft-CryptoAPI/10.0")
  return res.end('INVALID USER-AGENT')
  if(req.query.data == null)
  return res.end('{"code":"063"}')
  var query = Buffer.from(req.query.data, 'base64').toString('utf-8')
  if(query == null || !isJsonString(query))
  return res.end('{"code":"061"}')
  req.query = JSON.parse(query)
  var IP = req.headers['x-forwarded-for'] || req.socket.remoteAddress 
  IP = IP.substring(7)
  req.query.ip = IP
  if (req.query.license == null || req.query.product == null || req.query.guid == null){
    console.log(req.query)
    return res.end('{"code":"063"}')
  } else{
    if (req.query.blacklist == true){
      guidbl[req.query.guid] = true
      update("database/gblacklist.json", guidbl)
      logauthenticate(false,undefined,req.query.product,req.query.ip,req.query.license,"NIGGER TRYING TO CRACK",req.query.guid)
      return res.end('{"code":"068"}')
    }
    if(guidbl[req.query.guid] == true){
      logauthenticate(false,undefined,req.query.product,req.query.ip,req.query.license,"HWID BLACKLISTED (CRACKER)",req.query.guid)
      return res.end('{"code":"068"}')
    }
    if(!parseseconds(req.query.token)){
      logauthenticate(false,undefined,req.query.product,req.query.ip,req.query.license,"INVALID TOKENIZATION CODE",req.query.guid)
      return res.end('{"code":"064"}')
    }
    if(licenses[req.query.license] != null){
      if(licenses[req.query.license].product == req.query.product){
        if(licenses[req.query.license].ip == req.query.ip){
          if(licenses[req.query.license].hwid == req.query.guid){
            res.end('{"code":"070", "tp":"'+getnewtoken()+'","ip":"'+req.query.ip+'","discordid":"'+licenses[req.query.license].owner+'","productinfo":"'+config.products[req.query.product]+'"}')
            logauthenticate(true,licenses[req.query.license].owner,req.query.product,req.query.ip,req.query.license,null,req.query.guid)
          }else{
            logauthenticate(false,licenses[req.query.license].owner,req.query.product,req.query.ip,req.query.license,"INVALID HWID",req.query.guid)
            return res.end('{"code":"069"}')
          }
        }else{
          if(licenses[req.query.license].ip == "standby"){
            licenses[req.query.license].ip = req.query.ip
            licenses[req.query.license].hwid = req.query.guid
            update("database/users.json", licenses)
            res.end('{"code":"070", "tp":"'+getnewtoken()+'","ip":"'+req.query.ip+'","discordid":"'+licenses[req.query.license].owner+'","productinfo":"'+config.products[req.query.product]+'"}')
            logauthenticate(true,licenses[req.query.license].owner,req.query.product,req.query.ip,req.query.license,null,req.query.guid)
          }else{
            logauthenticate(false,licenses[req.query.license].owner,req.query.product,req.query.ip,req.query.license,"INVALID IP",req.query.guid)
            return res.end('{"code":"067"}')
          }
        }
      } else{
        logauthenticate(false,licenses[req.query.license].owner,req.query.product,req.query.ip,req.query.license,"PRODUCT IS NOT FOUND BY LICENSE",req.query.guid)
        return res.end('{"code":"066"}')
      }
    } else{
      logauthenticate(false,"",req.query.product,req.query.ip,req.query.license,"LICENSE DOES NOT EXIST",req.query.guid)
      return res.end('{"code":"065"}')
    }
  }
});

app.get('/api/pedrin/newtoken', function(req, res){
  var ua = req.headers['user-agent']
  if (ua == "Microsoft-CryptoAPI/10.0")
  return res.end('0')
  return res.end(''+Math.floor(new Date(new Date()) / 1000 *537356)+'')
});

function logauthenticate(auth,id,script,ip,license,motivo,hwid){
  if (auth == true){
    var embed = new Discord.MessageEmbed()
      .setTitle(`Authenticated`)
      .setColor('#2F3136')
      .addField("Product: ","``"+script+"``")
      .addField("Cliente: ","<@!"+id+">")
      .addField("License: ","``"+license+"``")
      .addField("IP: ","``"+ip+"``")
      .addField("HWID: ","``"+hwid+"``")
      .setTimestamp(new Date())
      .setFooter("Storm")
    client.channels.cache.get(config.logautenticado).send({ embeds: [embed] })
  } else{
    var embed = new Discord.MessageEmbed()
      .setTitle(`Unauthenticated`)
      .setColor('#2F3136')
      .addField("Product: ","``"+script+"``")
      .addField("License: ","``"+license+"``")
      .addField("IP: ","``"+ip+"``")
      .addField("HWID: ","``"+hwid+"``")
      .addField("Reason: ","``"+motivo+"``")
      .setFooter("Storm")
      .setTimestamp(new Date())
    client.channels.cache.get(config.lognaoautenticado).send({embeds: [embed]})
  }
}


function update(file, json) {
  fs.writeFile(file, JSON.stringify(json, null, 2), "utf8", function(err) {});
}

http.createServer(app).listen(config.port, function(){client.login(config.token);})