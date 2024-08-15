const mongoose = require("mongoose");
const User = require("./models/Users");

let instance = null;
class Database {

    constructor() {
        if (!instance) {
            this.mongoConnection = null;
            instance = this;
        }

        return instance;
    }

    async connect(options) {
        try {
            console.log("DB Connecting...");
            let db = await mongoose.connect(options.CONNECTION_STRING);

            this.mongoConnection = db;
            console.log("DB Connected.");
            // Kullanıcı ekleme işlemi
            const existingUser = await User.findOne({ email: "demo@demo.com" });
            if (!existingUser) {
                const newUser = new User({
                    email: "demo@demo.com", // Bu e-posta adresini değiştirebilirsiniz
                    first_name: "İsmail",
                    last_name: "Aldemir",
                    password: "12345678",
                    phone_number: "05305554433"
                });
                await newUser.save();
                console.log("Yeni kullanıcı başarıyla eklendi.");
            } else {
                console.log("Kullanıcı zaten mevcut: ", existingUser);
            }
        } catch (err) {
            console.error(err);
            process.exit(1);
        }

    }

}

module.exports = Database;