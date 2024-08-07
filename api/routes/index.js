var express = require("express");
var router = express.Router();

const fs = require("fs");
const path = require("path");

// Dil dosyalarını oku
router.get('/languages', (req, res) => {
  const localesPath = path.join(__dirname, '../../frontend/public/locales'); 
  fs.readdir(localesPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Dosyalar okunamadı.' });
    }
    // Sadece dizin olan dosyaları filtrele
    const languages = files.filter(file => fs.statSync(path.join(localesPath, file)).isDirectory());
    res.json(languages);
  });
});


let routes = fs.readdirSync(__dirname);

for (let route of routes) {
  if (route.includes(".js") && route != "index.js") {
    router.use("/" + route.replace(".js", ""), require("./" + route));
  }
}

//const config = require("../config");

/* GET home page. 
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Aldemir',config });
});
*/

module.exports = router;

