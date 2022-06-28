const Discord = require("discord.js");
const fs = require("fs");
const http = require("http");
const express = require("express");
const config = require("./config.json");

const app = express();

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
  makeCache: (manager) => {
    if (manager.name === "MessageManager") return new LimitedCollection({ maxSize: 0 });
    return new Collection();
  },
});

client.config = config;

client.on("message", (message) => {
  if (message.author.bot) return;

  if (message.content == "/configurate") {
    if (message.guild.ownerId != message.author.id) return message.reply({ content: "You aren´t the owner from this server please contact him to configure the channels !", components: [row2] });
    const row2 = new Discord.MessageActionRow().addComponents(new Discord.MessageButton().setCustomId("configurate").setLabel("CONFIGURATE").setStyle("SUCCESS"));
    message.reply({ content: "Click in the button to configurate the bot", components: [row2] });
  }
  if (message.content == "/configurate") {
    asyncintegrations();
  }
});

async function sendresetlog(embed) {
  try {
    await client.channels.cache.get(config.logresets).send({ embeds: [embed] });
  } catch {}
}

function isNumeric(str) {
  if (typeof str != "string") return false;
  return !isNaN(str) && !isNaN(parseFloat(str));
}

async function asyncintegrations() {
  try {
    await client.channels.cache
      .get(config.integrations)
      .bulkDelete(100)
      .catch(() => console.error);
  } catch {}
  try {
    await client.channels.cache
      .get(config.admintegrations)
      .bulkDelete(100)
      .catch(() => console.error);
  } catch {}
  genlcs = {};
  const row = new Discord.MessageActionRow().addComponents(
    new Discord.MessageButton().setCustomId("resetdevice").setLabel("RESET LICENSE DEVICE").setStyle("SUCCESS"),
    new Discord.MessageButton().setCustomId("getinfos").setLabel("GET YOUR LICENSES").setStyle("SUCCESS")
  );
  try {
    await client.channels.cache.get(config.integrations).send({ content: " ", components: [row] });
  } catch {}
  const row2 = new Discord.MessageActionRow().addComponents(
    new Discord.MessageButton().setCustomId("genlicense").setLabel("GENERATE LICENSE").setStyle("SUCCESS"),
    new Discord.MessageButton().setCustomId("getlicenseinfo").setLabel("GET LICENSE INFO").setStyle("SUCCESS"),
    new Discord.MessageButton().setCustomId("getuserlicenses").setLabel("GET USER LICENSES").setStyle("SUCCESS"),
    new Discord.MessageButton().setCustomId("unblacklisthw").setLabel("UNBLACKLIST IP").setStyle("DANGER"),
    new Discord.MessageButton().setCustomId("deletelicense").setLabel("DELETE LICENSE").setStyle("DANGER")
  );
  try {
    await client.channels.cache.get(config.admintegrations).send({ content: " ", components: [row2] });
  } catch {}
  console.clear();
  console.log("Bot e HTTP Server estao ONLINE!");
}

function calcdays(n, s) {
  var today = new Date(new Date().toUTCString()) / 1000;
  var calc = (n - today) / 60000 + parseInt(s);
  return Math.floor(calc);
}

function makeid(length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function getnewtoken() {
  var n = new Date(new Date().toUTCString());
  var calc = Math.floor(n / 1000);
  var time = Math.floor(calc * 237356);
  return Buffer(JSON.stringify(time, null, 2)).toString("base64");
}

function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

function parseseconds(utc) {
  var n = new Date(new Date().toUTCString());
  var calc = Math.floor(n / 1000) - utc;
  if (calc == 0 || (calc > -50 && calc < 50)) {
    return true;
  } else {
    return false;
  }
}

async function logauthenticate(auth, id, script, ip, license, motivo, hwid, expires) {
  if (auth == true) {
    var embed = new Discord.MessageEmbed()
      .setTitle(`Authenticated`)
      .setColor("#2F3136")
      .addField("Product: ", "``" + script + "``")
      .addField("Cliente: ", "<@!" + id + ">")
      .addField("License: ", "``" + license + "``")
      .addField("Expires: ", "``" + expires + "``")
      .addField("IP: ", "``" + ip + "``")
      .addField("HWID: ", "``" + hwid + "``")
      .setTimestamp(new Date())
      .setFooter(config.storename);
    try {
      await client.channels.cache.get(config.logautenticado).send({ embeds: [embed] });
    } catch {}
  } else {
    var embed = new Discord.MessageEmbed()
      .setTitle(`Unauthenticated`)
      .setColor("#2F3136")
      .addField("Product: ", "``" + script + "``")
      .addField("License: ", "``" + license + "``")
      .addField("IP: ", "``" + ip + "``")
      .addField("HWID: ", "``" + hwid + "``")
      .addField("Reason: ", "``" + motivo + "``")
      .setFooter(config.storename)
      .setTimestamp(new Date());
    try {
      await client.channels.cache.get(config.lognaoautenticado).send({ embeds: [embed] });
    } catch {}
  }
}

async function update(file, json) {
  fs.writeFile(file, JSON.stringify(json, null, 2), "utf8", function (err) {});
}

client.on("interactionCreate", async (button) => {
  const licenses = require("./database/users.json");
  const driscord = require("./database/discord.json");
  const guidbl = require("./database/gblacklist.json");
  if (button.customId == "resetdevice") {
    if (driscord[String(button.user.id)] == null) return button.reply({ content: "You don't have any license !", ephemeral: true });
    var combo = [];
    var keys = licenses;
    var qtd = 0;
    driscord[String(button.user.id)].forEach(function (k) {
      if (keys[k].expire == true) {
        var days = calcdays(keys[k].date, keys[k].days);
      }
      keyip = keys[k].ip;
      if (keyip == "standby") keyip = "";

      keyhw = keys[k].hwid;
      if (keyhw == "standby") keyhw = "";

      if ((days == null || days > 0) && keys[k].product != null) {
        var currlicense = {
          label: "Product: " + keys[k].product,
          description: "Current IP: " + keyip + ", License: " + k,
          value: k,
        };
        qtd = qtd + 1;
        combo.push(currlicense);
      }
    });
    if (qtd == 0) {
      return button.reply({ content: "You don't have any license !", ephemeral: true });
    }
    const row = new Discord.MessageActionRow().addComponents(new Discord.MessageSelectMenu().setCustomId("lcsreseter").setPlaceholder("Select the license you want to reset").setMinValues(1).setMaxValues(1).addOptions(combo));
    await button.reply({ content: "  ", components: [row], ephemeral: true });
  } else if (button.customId == "lcsreseter") {
    button.values.forEach(function (val) {
      if (licenses[val].ip != "standby" || licenses[val].hwid != "standby") {
        var embed = new Discord.MessageEmbed()
          .setTitle(`Log Resets`)
          .setColor("#2F3136")
          .addField("Product: ", "``" + licenses[val].product + "``")
          .addField("Cliente: ", "<@!" + button.user.id + ">")
          .addField("License: ", "``" + val + "``")
          .addField("IP: ", "``" + licenses[val].ip + "``")
          .addField("HWID: ", "``" + licenses[val].hwid + "``")
          .setTimestamp(new Date())
          .setFooter(config.storename);
        licenses[val].ip = "standby";
        licenses[val].hwid = "standby";
        update("database/users.json", licenses);
        sendresetlog(embed);
        button.reply({ content: "License devices id has been reseted !", ephemeral: true });
      } else {
        button.reply({ content: "This license is already reseted !", ephemeral: true });
      }
    });
  } else if (button.customId == "configurate") {
    const modal = new Discord.Modal().setCustomId("mconfigurate").setTitle("Generate license");
    const adm = new Discord.TextInputComponent().setCustomId("channeladm").setLabel("CHANNEL ID FOR LICENSE MANAGEMENT:").setStyle("SHORT");
    const costumers = new Discord.TextInputComponent().setCustomId("channelcostum").setLabel("CHANNEL ID FOR COSTUMERS MANAGEMENT:").setStyle("SHORT");
    const logsreset = new Discord.TextInputComponent().setCustomId("channelreset").setLabel("CHANNEL ID FOR RESET DEVICES LOG:").setStyle("SHORT");
    const logsauth = new Discord.TextInputComponent().setCustomId("channelauth").setLabel("CHANNEL ID FOR AUTHENTICATION LOG:").setStyle("SHORT");
    const logsnauth = new Discord.TextInputComponent().setCustomId("channelnauth").setLabel("CHANNEL ID FOR FAILED AUTHENTICATION LOG:").setStyle("SHORT");
    const firstActionRow = new Discord.MessageActionRow().addComponents(adm);
    const secondActionRow = new Discord.MessageActionRow().addComponents(costumers);
    const thirdActionRow = new Discord.MessageActionRow().addComponents(logsreset);
    const fourthActionRow = new Discord.MessageActionRow().addComponents(logsauth);
    const fifthdActionRow = new Discord.MessageActionRow().addComponents(logsnauth);
    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fifthdActionRow);
    button.showModal(modal);
  } else if (button.customId == "mconfigurate") {
    var admintegrations = button.fields.getTextInputValue("channeladm");
    var costumersintegrations = button.fields.getTextInputValue("channelcostum");
    var resetlogs = button.fields.getTextInputValue("channelreset");
    var authlogs = button.fields.getTextInputValue("channelauth");
    var nonauthlogs = button.fields.getTextInputValue("channelnauth");
    config.logautenticado = authlogs;
    config.lognaoautenticado = nonauthlogs;
    config.logresets = resetlogs;
    config.integrations = costumersintegrations;
    config.admintegrations = admintegrations;
    update("config.json", config);
    asyncintegrations();
    button.reply({ content: "Channel configs has been updated !", ephemeral: true });
  } else if (button.customId == "getinfos") {
    if (driscord[String(button.user.id)] == null) return button.reply({ content: "You don't have any license !", ephemeral: true });
    var products = "";
    var keys = licenses;
    driscord[String(button.user.id)].forEach(function (k) {
      var expires = "Never";
      if (keys[k] != null) {
        if (keys[k].expire != null) {
          var days = calcdays(keys[k].date, keys[k].days);
          expires = days + " days";
        }
        keyip = keys[k].ip;
        if (keyip == "standby") keyip = "";

        keyhw = keys[k].hwid;
        if (keyhw == "standby") keyhw = "";

        if ((days == null || days > 0) && keys[k].product != null) products = products + "```Product: " + keys[k].product + "\nLicense: " + k + "\nIP: " + keyip + "\nHWID: " + keyhw + "\nExpires:" + expires + "```";
      }
    });

    if (products == "") products = "All your licenses are expired";
    var embed = new Discord.MessageEmbed().setTitle("Your Products").setDescription(products).setColor("#2F3136");
    button.reply({ embeds: [embed], ephemeral: true });
  } else if (button.customId == "unblacklisthw") {
    const modal = new Discord.Modal().setCustomId("munblacklisthw").setTitle("Unblacklist IP adress");
    const favoriteColorInput = new Discord.TextInputComponent().setCustomId("hwid").setLabel("Enter IP adress:").setStyle("SHORT");
    const firstActionRow = new Discord.MessageActionRow().addComponents(favoriteColorInput);
    modal.addComponents(firstActionRow);
    await button.showModal(modal);
  } else if (button.customId == "getlicenseinfo") {
    const modal = new Discord.Modal().setCustomId("mgetlicenseinfo").setTitle("Get License Information");
    const favoriteColorInput = new Discord.TextInputComponent().setCustomId("license").setLabel("Enter License:").setStyle("SHORT");
    const firstActionRow = new Discord.MessageActionRow().addComponents(favoriteColorInput);
    modal.addComponents(firstActionRow);
    await button.showModal(modal);
  } else if (button.customId == "getuserlicenses") {
    const modal = new Discord.Modal().setCustomId("mgetuserlicenses").setTitle("Get User Licenses");
    const favoriteColorInput = new Discord.TextInputComponent().setCustomId("userid").setLabel("Enter Discord ID:").setStyle("SHORT");
    const firstActionRow = new Discord.MessageActionRow().addComponents(favoriteColorInput);
    modal.addComponents(firstActionRow);
    await button.showModal(modal);
  } else if (button.customId == "genlicense") {
    const modal = new Discord.Modal().setCustomId("mgenlicense").setTitle("Generate license");
    const favoriteColorInput = new Discord.TextInputComponent().setCustomId("userid").setLabel("Discord ID from user:").setStyle("SHORT").setRequired(true);
    const product = new Discord.TextInputComponent().setCustomId("product").setLabel("Product name:").setStyle("SHORT").setRequired(true);
    const days = new Discord.TextInputComponent().setCustomId("days").setLabel("Days to expire:").setStyle("SHORT").setRequired(false);
    const firstActionRow = new Discord.MessageActionRow().addComponents(favoriteColorInput);
    const secondActionRow = new Discord.MessageActionRow().addComponents(product);
    const thirdActionRow = new Discord.MessageActionRow().addComponents(days);
    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
    await button.showModal(modal);
  } else if (button.customId == "deletelicense") {
    const modal = new Discord.Modal().setCustomId("mdeletelicense").setTitle("Delete License");
    const favoriteColorInput = new Discord.TextInputComponent().setCustomId("license").setLabel("Enter License:").setStyle("SHORT");
    const firstActionRow = new Discord.MessageActionRow().addComponents(favoriteColorInput);
    modal.addComponents(firstActionRow);
    await button.showModal(modal);
  } else if (button.customId == "munblacklisthw") {
    guidbl[button.fields.getTextInputValue("hwid")] = null;
    update("database/gblacklist.json", guidbl);
    button.reply({ content: "IP removed from blacklist !", ephemeral: true });
  } else if (button.customId == "mdeletelicense") {
    if (licenses[button.fields.getTextInputValue("license")] == null) return button.reply({ content: "License not found !", ephemeral: true });
    licenses[button.fields.getTextInputValue("license")].product = null;
    update("database/users.json", licenses);
    return button.reply({ content: "License has been deleted!", ephemeral: true });
  } else if (button.customId == "mgetlicenseinfo") {
    var keys = licenses;
    var k = button.fields.getTextInputValue("license");
    if (licenses[k] == null || licenses[k].product == null) return button.reply({ content: "License not found", ephemeral: true });

    var expires = "Never";
    if (keys[k].expire == true) {
      var days = calcdays(keys[k].date, keys[k].days);
      if (days < 0) expires = " Expired";
      else expires = days + " days";
    }
    keyip = keys[k].ip;
    if (keyip == "standby") keyip = " ";

    keyhw = keys[k].hwid;
    if (keyhw == "standby") keyhw = " ";

    var embed = new Discord.MessageEmbed()
      .setTitle(`License Information\n`)
      .addField(`User: `, `<@!${keys[k].owner}>`)
      .addField(`License: `, "``" + k + "``")
      .addField(`Product: `, "``" + keys[k].product + "``")
      .addField(`Expires: `, "``" + expires + "``")
      .addField(`IP: `, "``" + keyip + "``")
      .addField(`HWID: `, "``" + keyhw + "``")
      .setColor("#2F3136");
    button.reply({ embeds: [embed], ephemeral: true });
  } else if (button.customId == "mgenlicense") {
    var prodname = button.fields.getTextInputValue("product");
    var person = button.fields.getTextInputValue("userid");
    var days = button.fields.getTextInputValue("days");
    var expiration = "Never";
    key = makeid(50);
    licenses[key] = {};
    licenses[key].product = prodname;
    licenses[key].ip = "standby";
    licenses[key].hwid = "standby";
    licenses[key].owner = person;
    var vral = isNumeric(days);
    if (days != null && days != "" && days != " " && vral == true) {
      licenses[key].expire = true;
      licenses[key].days = days;
      licenses[key].date = Math.floor(new Date().getTime() / 1000);
      expiration = days + " days";
    }
    var licensesarr = driscord[person];
    if (licensesarr == null) licensesarr = [];
    licensesarr.push(key);
    driscord[person] = licensesarr;
    update("database/users.json", licenses);
    update("database/discord.json", driscord);
    var embed = new Discord.MessageEmbed()
      .setTitle(`New Product\n`)
      .addField(`User: `, `<@!${person}>`)
      .addField(`License: `, "``" + key + "``")
      .addField(`Product: `, "``" + prodname + "``")
      .addField(`Expires: `, "``" + expiration + "``")
      .setColor("#2F3136");
    button.reply({ content: "Key sent in client's private !", ephemeral: true });
    try {
      await client.users.fetch(person, false).then((user) => {
        user.send({ embeds: [embed] });
      });
    } catch {}
  } else if (button.customId == "mgetuserlicenses") {
    var person = button.fields.getTextInputValue("userid");
    if (driscord[String(person)] == null) return button.reply({ content: "This user has no license !", ephemeral: true });
    var products = "";
    var keys = licenses;
    driscord[String(person)].forEach(function (k) {
      var expires = "Never";
      if (keys[k] != null) {
        if (keys[k].expire != null) {
          var days = calcdays(keys[k].date, keys[k].days);
          expires = days + " days";
        }
        keyip = keys[k].ip;
        if (keyip == "standby") keyip = "";

        keyhw = keys[k].hwid;
        if (keyhw == "standby") keyhw = "";

        if ((days == null || days > 0) && keys[k].product != null) products = products + "```Product: " + keys[k].product + "\nLicense: " + k + "\nIP: " + keyip + "\nHWID: " + keyhw + "\nExpires:" + expires + "```";
      }
    });

    if (products == "") products = "All licenses from this user are expired";
    var embed = new Discord.MessageEmbed()
      .setTitle("User Licenses")
      .addField("User: ", "<@!" + person + ">")
      .setDescription(products)
      .setColor("#2F3136");
    button.reply({ embeds: [embed], ephemeral: true });
  }
});

client.on("ready", () => {
  console.clear();
  client.user.setStatus("online");
  console.log("Bot e HTTP Server estao ONLINE!");
  setInterval(() => {
    console.clear();
    console.log("Bot e HTTP Server estao ONLINE!");
  }, 60000);
});

app.get("/api/pedrin/authenticate", function (req, res) {
  var ua = req.headers["user-agent"];
  if (ua == "Microsoft-CryptoAPI/10.0") return res.end("INVALID USER-AGENT");
  if (req.query.data == null) return res.end('{"code":"063"}');
  var query = Buffer.from(req.query.data, "base64").toString("utf-8");
  if (query == null || !isJsonString(query)) return res.end('{"code":"061"}');
  req.query = JSON.parse(query);
  var IP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  IP = IP.substring(7);
  req.query.ip = IP;
  if (req.query.license == null || req.query.product == null) {
    return res.end('{"code":"063"}');
  } else {
    const licenses = require("./database/users.json");
    const guidbl = require("./database/gblacklist.json");
    if (req.query.blacklist == true) {
      guidbl[req.query.ip] = true;
      update("database/gblacklist.json", guidbl);
      if(req.query.guid == null){
        req.query.guid ="NULLED (os.execute rewrited)"
      }
      logauthenticate(false, undefined, req.query.product, req.query.ip, req.query.license, "NIGGER TRYING TO CRACK", req.query.guid);
      return res.end('{"code":"068"}');
    }
    if(req.query.guid == null){
      logauthenticate(false, undefined, req.query.product, req.query.ip, req.query.license, "HWID NULL (Posssible Cracker)", req.query.guid);
      return res.end('{"code":"093"}');
    }
    if (guidbl[req.query.ip] == true) {
      logauthenticate(false, undefined, req.query.product, req.query.ip, req.query.license, "IP BLACKLISTED (CRACKER)", req.query.guid);
      return res.end('{"code":"068"}');
    }
    if (!parseseconds(req.query.token)) {
      logauthenticate(false, undefined, req.query.product, req.query.ip, req.query.license, "INVALID TOKENIZATION CODE", req.query.guid);
      return res.end('{"code":"064"}');
    }
    if (licenses[req.query.license] != null) {
      if (licenses[req.query.license].product == req.query.product) {
        var expires = "Never";
        var k = req.query.license;
        var days = 1;
        if (licenses[k].expire == true) {
          days = calcdays(licenses[k].date, licenses[k].days);
          expires = days + " days";
        }
        if (days == null || days < 0 || licenses[k].product == null) {
          logauthenticate(false, licenses[req.query.license].owner, req.query.product, req.query.ip, req.query.license, "LICENSE EXPIRED", req.query.guid);
          return res.end('{"code":"072"}');
        }
        if (licenses[req.query.license].ip == req.query.ip) {
          if (licenses[req.query.license].hwid == req.query.guid) {
            res.end('{"code":"070", "tp":"' + getnewtoken() + '","expires": "' + expires + '"}');
            logauthenticate(true, licenses[req.query.license].owner, req.query.product, req.query.ip, req.query.license, null, req.query.guid, expires);
          } else {
            logauthenticate(false, licenses[req.query.license].owner, req.query.product, req.query.ip, req.query.license, "INVALID HWID", req.query.guid);
            return res.end('{"code":"069"}');
          }
        } else {
          if (licenses[req.query.license].ip == "standby") {
            licenses[req.query.license].ip = req.query.ip;
            licenses[req.query.license].hwid = req.query.guid;
            update("database/users.json", licenses);
            res.end('{"code":"070", "tp":"' + getnewtoken() + '","expires": "' + expires + '"}');
            logauthenticate(true, licenses[req.query.license].owner, req.query.product, req.query.ip, req.query.license, null, req.query.guid, expires);
          } else {
            logauthenticate(false, licenses[req.query.license].owner, req.query.product, req.query.ip, req.query.license, "INVALID IP", req.query.guid);
            return res.end('{"code":"067"}');
          }
        }
      } else {
        logauthenticate(false, licenses[req.query.license].owner, req.query.product, req.query.ip, req.query.license, "PRODUCT IS NOT FOUND BY LICENSE", req.query.guid);
        return res.end('{"code":"066"}');
      }
    } else {
      logauthenticate(false, "", req.query.product, req.query.ip, req.query.license, "LICENSE DOES NOT EXIST", req.query.guid);
      return res.end('{"code":"065"}');
    }
  }
});

http.createServer(app).listen(config.port, function () {
  client.login(config.token);
});
