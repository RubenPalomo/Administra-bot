const TelegramBot = require("node-telegram-bot-api");
const token = "TOKEN";
const bot = new TelegramBot(token, { polling: true });
const translate = require("@iamtraction/google-translate");
const util = require("util");

/*
 *
 *   *   *   FUNCTIONS    *   *   *
 *
 */

// Wait function
const waitUntil = util.promisify(setTimeout);

// Translator function
function translateText(msg, string, langTo) {
	if (langTo === "en") bot.sendMessage(msg.chat.id, string);
	else
		translate(string, { from: "en", to: langTo })
			.then((res) => {
				bot.sendMessage(msg.chat.id, res.text);
			})
			.catch((err) => {
				console.error(err);
			});
}

// Banned word search function
function isThereABannedWord(string) {
	if (string === undefined) return false;
	const bannedWords = [
		"gilipollas",
		"subnormal",
		"retrasado",
		"puta",
		"polla",
		"marica",
		"maricón",
	];
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
	translateText(
		msg,
		`Hello ${msg.from.first_name}. I'm your favorite group manager bot. Add me to your groups and give me admin so I can manage them❤`,
		msg.from.language_code
	);
});

// Listener
bot.on("message", (msg) => {
	// Welcome and farewell message
	if (msg.new_chat_members !== undefined) {
		let info = bot.getChat(msg.chat.id);

		translateText(
			msg,
			`Hi ${msg.new_chat_member.first_name}! Welcome to ${msg.chat.title}🎉\n\n` +
				"The rules are as follows:\n1. Don't be rude. Watch your words and respect each other.\n" +
				"2. Just relax and enjoy!",
			msg.from.language_code
		);

		info
			.then((response) => {
				let description = response.description;
				if (description === undefined) description = "";
				bot.setChatDescription(
					msg.chat.id,
					`${description}\n - @${msg.new_chat_member.username}`
				);
			})
			.catch((error) => console.log(error));
	} else if (msg.left_chat_member !== undefined) {
		let info = bot.getChat(msg.chat.id);

		bot.sendMessage(
			msg.chat.id,
			`${msg.left_chat_member.first_name} left the group😢`
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
		if (data.status === "member" && isThereABannedWord(msg.text)) {
			bot.sendMessage(msg.chat.id, `${msg.from.first_name} was a bad guy.`, {
				reply_to_message_id: msg.message_id,
			});
			bot.banChatMember(msg.chat.id, msg.from.id);
		}
	});
});

// Command to report to the admins
bot.onText(/^\/report/, (msg) => {
  if (msg.reply_to_message === undefined) return;
	let stringAdmins = "";
	bot
		.getChatAdministrators(msg.chat.id)
		.then((response) => {
			response.forEach((admin) => {
				stringAdmins += `@${admin.user.username}\n`;
			});
			bot.sendMessage(
				msg.chat.id,
				stringAdmins.replace("@AhdministraBot\n", ""),
				{ reply_to_message_id: msg.reply_to_message.message_id }
			);
		})
		.catch((error) => console.log(error));
});

// Command to call admins
bot.onText(/^\/admins/, (msg) => {
	let stringAdmins = "Admins:\n";
	bot
		.getChatAdministrators(msg.chat.id)
		.then((response) => {
			response.forEach((admin) => {
				stringAdmins += `@${admin.user.username}\n`;
			});
			bot.sendMessage(
				msg.chat.id,
				stringAdmins.replace("@AhdministraBot\n", "")
			);
		})
		.catch((error) => console.log(error));
});

// Command to promote a chat member to admin and set him a title (optional)
bot.onText(/^\/promote/, (msg) => {
	if (msg.chat.type !== "supergroup") return;
	const title = msg.text.replace("/promote", "");

	bot
		.promoteChatMember(msg.chat.id, msg.reply_to_message.from.id, {
			is_anonymous: false,
			can_manage_chat: true,
			can_post_messages: true,
			can_edit_messages: false,
			can_delete_messages: false,
			can_manage_video_chats: false,
			can_restrict_members: false,
			can_promote_members: false,
			can_change_info: true,
			can_invite_users: true,
			can_pin_messages: true,
			can_manage_topics: false,
		})
		.then(() => {
			translateText(
				msg,
				"The user was promoted to admin🥳",
				msg.from.language_code
			);
			bot
				.getChatMember(msg.chat.id, msg.reply_to_message.from.id)
				.then(function (data) {
					if (title === "") return;
					bot.setChatAdministratorCustomTitle(
						msg.chat.id,
						msg.reply_to_message.from.id,
						title
					);
					translateText(
						msg,
						`The title was changed to ${title}.`,
						msg.from.language_code
					);
				})
				.catch((error) => console.log(error));
		})
		.catch((error) => console.log(error));
});

// Command to create a link invitation
bot.onText(/^\/link/, (msg) => {
	bot
		.createChatInviteLink(msg.chat.id)
		.then((response) => {
			bot.sendMessage(msg.chat.id, response.invite_link);
		})
		.catch((error) => console.log(error));
});

// Command to demote an admin
bot.onText(/^\/demote/, (msg) => {
	if (msg.chat.type !== "supergroup") return;
	bot
		.promoteChatMember(msg.chat.id, msg.reply_to_message.from.id, {
			is_anonymous: false,
			can_manage_chat: false,
			can_post_messages: false,
			can_edit_messages: false,
			can_delete_messages: false,
			can_manage_video_chats: false,
			can_restrict_members: false,
			can_promote_members: false,
			can_change_info: false,
			can_invite_users: false,
			can_pin_messages: false,
			can_manage_topics: false,
		})
		.then(() => {
			translateText(msg, "The admin was demoted😔", msg.from.language_code);
		})
		.catch((error) => console.log(error));
});

// Command to ban an user
bot.onText(/^\/ban/, (msg) => {
	if (msg.reply_to_message === undefined) return;
	bot.getChatMember(msg.chat.id, msg.from.id).then(function (dataBanner) {
		if (
			dataBanner.status === "creator" ||
			dataBanner.status === "administrator"
		) {
			bot
				.getChatMember(msg.chat.id, msg.reply_to_message.from.id)
				.then(function (dataBanned) {
					if (dataBanned.status === "member") {
						try {
							bot.banChatMember(msg.chat.id, dataBanned.user.id);
						} catch (error) {
							console.log(error);
						}
					} else {
						translateText(
							msg,
							"The selected user is an administrator. Cannot be banned!",
							msg.from.language_code
						);
					}
				});
		} else {
			translateText(
				msg,
				"I'm sorry, you are not an admin. You don't have permission to use that command.",
				msg.from.language_code
			);
		}
	});
});

// Command for tests
bot.onText(/^\/test/, (msg) => {});
