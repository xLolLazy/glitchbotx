const Discord = require("discord.js");
const client = new Discord.Client();
const ayarlar = require("./ayarlar.json");
const chalk = require("chalk");
const moment = require("moment");
var Jimp = require("jimp");
const { Client, Util } = require("discord.js");
const fs = require("fs");
const db = require("quick.db");
const http = require("http");
const express = require("express");
require("./util/eventLoader.js")(client);
const path = require("path");
const request = require("request");
const snekfetch = require("snekfetch");
const queue = new Map();
const YouTube = require("simple-youtube-api");
const ytdl = require("ytdl-core");

const app = express();
app.get("/", (request, response) => {
  console.log(Date.now() + " Ping tamamdır.");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

var prefix = ayarlar.prefix;

const log = message => {
  console.log(`${message}`);
};

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir("./komutlar/", (err, files) => {
  if (err) console.error(err);
  log(`${files.length} komut yüklenecek.`);
  files.forEach(f => {
    let props = require(`./komutlar/${f}`);
    log(`Yüklenen komut: ${props.help.name}.`);
    client.commands.set(props.help.name, props);
    props.conf.aliases.forEach(alias => {
      client.aliases.set(alias, props.help.name);
    });
  });
});

client.reload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.load = command => {
  return new Promise((resolve, reject) => {
    try {
      let cmd = require(`./komutlar/${command}`);
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.unload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.elevation = message => {
  if (!message.guild) {
    return;
  }
  let permlvl = 0;
  if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
  if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
  if (message.author.id === ayarlar.sahip) permlvl = 4;
  return permlvl;
};

var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;

client.on("warn", e => {
  console.log(chalk.bgYellow(e.replace(regToken, "that was redacted")));
});

client.on("error", e => {
  console.log(chalk.bgRed(e.replace(regToken, "that was redacted")));
});

client.login(ayarlar.token);

//--------------------//
//---Gelişmiş-HG-----//

//---Gelişmiş-HG----//
//Etiket-Prefix//

//Etiket-Prefix//
//------Oto-rol-v12---//

client.on("guildMemberAdd", async member => {
  let kanal1 = await db.fetch(`otorolkanal_${member.guild.id}`);
  let rol1 = await db.fetch(`otorolrol_${member.guild.id}`);

  let kanal = member.guild.channels.cache.get(kanal1);
  let rol = member.guild.roles.cache.get(rol1);

  if (!kanal) return;
  if (!rol) return;

  const embed = new Discord.MessageEmbed()

    .setColor("BLACK")
    .setDescription(
      `Sunucuya Katılan **${member}** Adlı Kullanıcıya Başarıyla \`${rol.name}\` Rolü Verildi.`
    );

  kanal.send(embed);
  member.roles.add(rol);
});
//----Oto-rol-v12-----//

//----Telde Gözükme//
//const Constants = require("discord.js/src/util/Constants.js");
//Constants.DefaultOptions.ws.properties.$browser = "Discord idli";
//--Telde Gözükme//
//-------AFK-----------//
const ms = require("parse-ms");
const { DiscordAPIError } = require("discord.js");

client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (message.content.includes(`afk`)) return;

  if (await db.fetch(`afk_${message.author.id}`)) {
    db.delete(`afk_${message.author.id}`);
    db.delete(`afk_süre_${message.author.id}`);

    const embed = new Discord.MessageEmbed()

      .setColor("GREEN")
      .setAuthor(message.author.username, message.author.avatarURL)
      .setDescription(`Afk Modundan Başarıyla Çıkıldı.`);

    message.channel.send(embed);
  }
  var USER = message.mentions.users.first();
  if (!USER) return;
  var REASON = await db.fetch(`afk_${USER.id}`);

  if (REASON) {
    let süre = await db.fetch(`afk_süre_${USER.id}`);
    let timeObj = ms(Date.now() - süre);

    const afk = new Discord.MessageEmbed()

      .setColor("RED")
      .setDescription(
        `**BU KULLANICI AFK**\n\n**Afk Olan Kullanıcı :** \`${USER.tag}\`\n**Afk Süresi :** \`${timeObj.hours}saat\` \`${timeObj.minutes}dakika\` \`${timeObj.seconds}saniye\`\n**Sebep :** \`${REASON}\``
      );

    message.channel.send(afk);
  }
});

//------AFK-------//
//--Kanal-Koruma--//

client.on("channelDelete", async function(channel) {
  let rol = await db.fetch(`kanalk_${channel.guild.id}`);

  if (rol) {
    const guild = channel.guild.cache;
    let channelp = channel.parentID;

    channel.clone().then(z => {
      let kanal = z.guild.channels.find(c => c.name === z.name);
      kanal.setParent(
        kanal.guild.channels.find(channel => channel.id === channelp)
      );
    });
  }
});
//--Kanal-Koruma--//
//-----Mod-Log----//
client.on("messageDelete", async message => {
  // mod-log
  let modlogs = db.get(`log_${message.guild.id}`);
  const modlogkanal = message.guild.channels.cache.find(
    kanal => kanal.id === modlogs
  );
  if (!modlogkanal) return;
  const embed = new Discord.MessageEmbed()
    .setColor("RANDOM")
    .setTitle("MESAJ SİLİNDİ")
    .setDescription(
      ` <@!${message.author.id}> **adlı kullanıcı tarafından** <#${message.channel.id}> **kanalına gönderilen mesaj silindi!** \n\nSilinen Mesaj: **${message.content}**`
    )
    .setFooter(" Log Sistemi");
  modlogkanal.send(embed);
});

client.on("guildBanAdd", async message => {
  let modlogs = db.get(`log_${message.guild.id}`);
  const modlogkanal = message.guild.channels.cache.find(
    kanal => kanal.id === modlogs
  );
  if (!modlogkanal) return;
  const embed = new Discord.MessageEmbed()
    .setColor("RANDOM")

    .setDescription(
      `**Üye Sunucudan Yasaklandı!** \n<@!${message.user.id}>, ${message.user.tag}`
    )
    .setThumbnail(message.user.avatarURL)
    .setFooter("Log Sistemi");
  modlogkanal.send(embed);
});
client.on("channelCreate", async channel => {
  let modlogs = db.get(`log_${channel.guild.id}`);
  const modlogkanal = channel.guild.channels.cache.find(
    kanal => kanal.id === modlogs
  );
  if (!modlogkanal) return;
  if (channel.type === "text") {
    let embed = new Discord.MessageEmbed()
      .setColor("#ffd100")
      .setTitle("METİN KANALI OLUŞTURULDU")
      .setDescription(` ${channel.name} **Adlı Metin Kanalı Oluşturuldu!**`)
      .setFooter(`Log Sistemi Kanal ID: ${channel.id}`);
    modlogkanal.send({ embed });
  }
  if (channel.type === "voice") {
    let embed = new Discord.MessageEmbed()
      .setColor("#ffd100")
      .setTitle("SES KANALI OLUŞTURULDU")
      .setDescription(` ${channel.name} **Adlı Ses Kanalı Oluşturuldu!**`)
      .setFooter(`Log Sistemi Kanal ID: ${channel.id}`);

    modlogkanal.send({ embed });
  }
});
client.on("channelDelete", async channel => {
  let modlogs = db.get(`log_${channel.guild.id}`);
  const modlogkanal = channel.guild.channels.cache.find(
    kanal => kanal.id === modlogs
  );
  if (!modlogkanal) return;
  if (channel.type === "text") {
    let embed = new Discord.MessageEmbed()
      .setColor("#ffd100")
      .setDescription(`${channel.name} **Adlın Metin Kanalı  Silindi**`)
      .setFooter(`Log Sistemi Kanal ID: ${channel.id}`);
    modlogkanal.send({ embed });
  }
  if (channel.type === "voice") {
    let embed = new Discord.MessageEmbed()
      .setColor("RANDOM")
      .setTitle("SES KANALI SİLİNDİ")
      .setDescription(`${channel.name} **Adlı Ses Kanalı Silindi**`)
      .setFooter(`Log Sistemi  Kanal ID: ${channel.id}`);
    modlogkanal.send({ embed });
  }
});
client.on("messageUpdate", async (oldMsg, newMsg) => {
  if (oldMsg.author.bot) return;
  var user = oldMsg.author;
  if (db.has(`log_${oldMsg.guild.id}`) === false) return;
  var kanal = oldMsg.guild.channels.cache.get(
    db
      .fetch(`log_${oldMsg.guild.id}`)
      .replace("<#", "")
      .replace(">", "")
  );
  if (!kanal) return;
  const embed = new Discord.MessageEmbed()
    .setColor("RANDOM")
    .addField("Kullanıcı", oldMsg.author.tag, true)
    .addField("Eski Mesaj", `  ${oldMsg.content}  `)
    .addField("Yeni Mesaj", `${newMsg.content}`)
    .setThumbnail(oldMsg.author.avatarURL);
  kanal.send(embed);
});
//-----Mod-Log----//
//--Sa-As--------//
client.on("message", async message => {
  const Bdgo = message.content.toLocaleLowerCase();

  if (
    Bdgo === "selam" ||
    Bdgo === "sa" ||
    Bdgo === "selamün aleyküm" ||
    Bdgo === "selamun aleyküm" ||
    Bdgo === "slm" ||
    Bdgo === "sea"
  ) {
    let e = await db.fetch(`sa-as_${message.guild.id}`);
    if (e === "acik") {
      const embed = new Discord.MessageEmbed()

        .setDescription("Aleyküm Selam, Hoş Geldin ^-^")
        .setColor("GREEN");

      return message.channel.send(embed);
    }
  }
});
//-----Sa-As-----//
//--Capslock-Engel--//
client.on("message", async msg => {
  if (msg.channel.type === "dm") return;
  if (msg.author.bot) return;
  if (msg.content.length > 4) {
    if (db.fetch(`capslock_${msg.guild.id}`)) {
      let caps = msg.content.toUpperCase();
      if (msg.content == caps) {
        if (!msg.member.hasPermission("ADMINISTRATOR")) {
          if (!msg.mentions.users.first()) {
            msg.delete();
            return msg.channel
              .send(
                `✋ ${msg.author}, Bu sunucuda, büyük harf kullanımı engellenmekte!`
              )
              .then(m => m.delete(5000));
          }
        }
      }
    } //darcode
  }
});
//--Capslock-Engel--//
//Davet-Sistemi//
const invites = {};

const wait = require("util").promisify(setTimeout);

client.on("ready", () => {
  wait(1000);

  client.guilds.cache.forEach(g => {
    g.fetchInvites().then(guildInvites => {
      invites[g.id] = guildInvites;
    });
  });
});

client.on("guildMemberAdd", async member => {
  if (member.user.bot) return;
  member.guild.fetchInvites().then(async guildInvites => {
    let kanal = await db.fetch(`davetlog_${member.guild.id}`);
    if (!kanal) return;
    const ei = invites[member.guild.id];

    invites[member.guild.id] = guildInvites;
    const invite = await guildInvites.find(
      i => (ei.get(i.code) == null ? i.uses - 1 : ei.get(i.code).uses) < i.uses
    );
    const daveteden = member.guild.members.cache.get(invite.inviter.id);

    db.add(`davet_${invite.inviter.id}_${member.guild.id}`, +1);
    db.set(`bunudavet_${member.id}`, invite.inviter.id);
    let davetsayiv2 = await db.fetch(
      `davet_${invite.inviter.id}_${member.guild.id}`
    );

    let davetsayi;
    if (!davetsayiv2) davetsayi = 0;
    else
      davetsayi = await db.fetch(
        `davet_${invite.inviter.id}_${member.guild.id}`
      );

    client.channels.cache
      .get(kanal)
      .send(
        `**${member} Adlı Kullanıcı Aramıza Katıldı | Kullanıcıyı Davet Eden  ${daveteden} | Toplam **${davetsayi}** Daveti Oldu**`
      );
  });
});

client.on("guildMemberRemove", async member => {
  let kanal = await db.fetch(`davetlog_${member.guild.id}`);
  if (!kanal) return;
  let davetçi = await db.fetch(`bunudavet_${member.id}`);
  const daveteden = member.guild.members.cache.get(davetçi);
  let mesaj = db.fetch(`davetbbmesaj_${member.guild.id}`);
  db.add(`davet_${davetçi}_${member.guild.id}`, -1);
  let davetsayi = await db.fetch(`davet_${davetçi}_${member.guild.id}`);

  if (!davetçi) {
    return client.channels.cache
      .get(kanal)
      .send(
        `**${member} Adlı Kullanıcı Aramızdan Ayarıldı Davet Eden Bulunamadı!**`
      );
  } else {
    client.channels.cache
      .get(kanal)
      .send(
        `**${member} Adlı Kullanıcı Aramızadan Ayrıldı | Kullanıcıyı Davet Eden ${daveteden} | Toplam  **${davetsayi}** Daveti Kaldı**`
      );
  }
});
client.on("message", async message => {
  if (message.author.bot) return;
  let yazılar = db.fetch(`${message.guild.id}.otocevap.yazılar`);
  let cevaplar = db.fetch(`${message.guild.id}.otocevap.cevaplar`);
  var efe = "";
  let sunucuadı = message.guild.name;
  let üyesayı = message.guild.members.cache.size;
  for (
    var i = 0;
    i <
    (db.fetch(`${message.guild.id}.otocevap.yazılar`)
      ? db.fetch(`${message.guild.id}.otocevap.yazılar`).length
      : 0);
    i++
  ) {
    if (message.content.toLowerCase() == yazılar[i].toLowerCase()) {
      efe += `${cevaplar[i]
        .replace("{sunucuadı}", `${sunucuadı}`)
        .replace("{üyesayı}", `${üyesayı}`)}`;
      message.channel.send(`${efe}`);
    }
  }
});

//////////////////////////////////////////////////////////////////////////////////////////// İstatistik Komutu

client.on("userUpdate", async (oldUser, newUser) => {
  if (oldUser.username !== newUser.username) {
    const tag = "TAGINIZ";
    const sunucu = "SUNUCU ID";
    const kanal = "KANAL ID";
    const rol = "ROL ID";

    try {
      if (
        newUser.username.includes(tag) &&
        !client.guilds.cache
          .get(sunucu)
          .members.cache.get(newUser.id)
          .roles.cache.has(rol)
      ) {
        await client.channels.cache
          .get(kanal)
          .send(
            new Discord.MessageEmbed()
              .setColor("GREEN")
              .setDescription(
                `${newUser} ${tag} Tagımızı Aldığı İçin <@&${rol}> Rolünü Verdim`
              )
          );
        await client.guilds.cache
          .get(sunucu)
          .members.cache.get(newUser.id)
          .roles.add(rol);
        await client.guilds.cache
          .get(sunucu)
          .members.cache.get(newUser.id)
          .send(
            `Selam ${
              newUser.username
            }, Sunucumuzda ${tag} Tagımızı Aldığın İçin ${
              client.guilds.cache.get(sunucu).roles.cache.get(rol).name
            } Rolünü Sana Verdim!`
          );
      }
      if (
        !newUser.username.includes(tag) &&
        client.guilds.cache
          .get(sunucu)
          .members.cache.get(newUser.id)
          .roles.cache.has(rol)
      ) {
        await client.channels.cache
          .get(kanal)
          .send(
            new Discord.MessageEmbed()
              .setColor("RED")
              .setDescription(
                `${newUser} ${tag} Tagımızı Çıkardığı İçin <@&${rol}> Rolünü Aldım`
              )
          );
        await client.guilds.cache
          .get(sunucu)
          .members.cache.get(newUser.id)
          .roles.remove(rol);
        await client.guilds.cache
          .get(sunucu)
          .members.cache.get(newUser.id)
          .send(
            `Selam **${
              newUser.username
            }**, Sunucumuzda ${tag} Tagımızı Çıkardığın İçin ${
              client.guilds.cache.get(sunucu).roles.cache.get(rol).name
            } Rolünü Senden Aldım!`
          );
      }
    } catch (e) {
      console.log(`Bir hata oluştu! ${e}`);
    }
  }
});
