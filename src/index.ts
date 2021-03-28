import Discord, { Guild } from "discord.js";
import { bad_words, discord_token, max_warnings, mongo_url } from "./config.js";
import pkg from "mongodb";
const { MongoClient } = pkg;
import { Warning } from "./types/Warning.js";
// make mongodb client
const mongo_client = new MongoClient(mongo_url, {
	useUnifiedTopology: true,
	useNewUrlParser: true,
});
await mongo_client.connect();
// get db
const db = mongo_client.db("mod-bot");
// get collection of warnings
const warnings = db.collection("warnings");
// make discord client
const discord_client = new Discord.Client();
// on ready event
discord_client.once("ready", () => {
	console.log("ready");
});
// on message, look if it contains any bad word
discord_client.on("message", async (message: Discord.Message) => {
	for (let i = 0; i < bad_words.length; i++) {
		if (message.content.toLowerCase().includes(bad_words[i])) {
			// query db if user already has warning
			const userWarnings: Warning = await warnings.findOne({
				uuid: message.author.id,
			});
			// if not, insert a document for the user with one warning
			if (userWarnings === null) {
				warnings.insertOne({ uuid: message.author.id, count: 1 });
				// reply with warning message
				message.reply(
					"You You got warned for the usage of banned words! You now have 1 warning!"
				);
				break;
			}
			// if they already have warnings, increment the count on their doc
			if (userWarnings.count <= max_warnings) {
				warnings.updateOne(
					{ uuid: message.author.id },
					{ $inc: { count: 1 } }
				);
			}
			// if they have the max count of warnings allowed, they get banned
			if (userWarnings.count + 1 === max_warnings) {
				message.guild?.members.ban(message.author.id);
			}
			// reply
			message.reply(
				"You got warned for the usage of banned words! You now have " +
					(userWarnings.count + 1) +
					" warnings!"
			);
			break;
		}
	}
});
// login to discord
discord_client.login(discord_token);
