const TelegramBot = require("node-telegram-bot-api");
const token = "1463801315:AAFAR9_UxC3PLgvYP1d0kMg_lWWMhou7jvw";
const bot = new TelegramBot(token, { polling: true });
const util = require("util");
const waitUntil = util.promisify(setTimeout);

/*
 *
 *   *   *   FUNCTIONS    *   *   *
 *
 */

function isThereABannedWord(string) {
  console.log(string);
  if (string == undefined) return false;
  const bannedWords = ["caca", "culo", "calvo"];
  const arrayWords = string.split(" ");
  let isBanned = false;
  arrayWords.forEach((word) => {
    if (bannedWords.includes(word.toLowerCase())) isBanned = true;
  });
  return isBanned;
}

/*
 *
 *   *   *   COMMAND LIST    *   *   *
 *
 */

// Welcome command
bot.onText(/^\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `Hello ${msg.from.first_name}. I'm your favorite group manager bot. Add me to your groups and give me admin so I can manage them.❤`
  );
});

bot.on("message", (msg) => {
  // Welcome and farewell message
  if (msg.new_chat_members != undefined) {
    let info = bot.getChat(msg.chat.id);

    bot.sendMessage(
      msg.chat.id,
      `Hi ${msg.new_chat_member.first_name}! Welcome to ${msg.chat.title}\n\n` +
        "The rules are as follows:\n1. Don't be rude. Watch your words and respect each other.\n"
    );
    info
      .then((response) => {
        const description = response.description;
        bot.setChatDescription(
          msg.chat.id,
          `${description}\n - @${msg.new_chat_member.username}`
        );
      })
      .catch((error) => console.log(error));
  } else if (msg.left_chat_member != undefined) {
    let info = bot.getChat(msg.chat.id);

    bot.sendMessage(
      msg.chat.id,
      `${msg.left_chat_member.first_name} left the group.`
    );
    info.then((response) => {
      const description = response.description;
      bot.setChatDescription(
        msg.chat.id,
        description.replace(`\n - @${msg.left_chat_member.username}`, "")
      );
    });
  }

  // Ban the bad guys
  bot.getChatMember(msg.chat.id, msg.from.id).then(function (data) {
    if (data.status == "member" && isThereABannedWord(msg.text)) {
      bot.sendMessage(msg.chat.id, `${msg.from.first_name} was a bad guy.`);
      try {
        bot.banChatMember(msg.chat.id, msg.from.id);
      } catch (error) {}
    }
  });
});

bot.onText(/^\/test/, (msg) => {
  let info = bot.getChat(msg.chat.id);
  info.then((response) => {
    const description = response.description;
    bot.setChatDescription(
      msg.chat.id,
      `${description}\n@${msg.from.username}`
    );
  });
});
