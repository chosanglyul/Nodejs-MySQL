const Koa = require('koa');
const app = new Koa();
const Router = require('koa-router');
const router = new Router();
const client = require('cheerio-httpcli');
const mysql = require('mysql');
const db_config  = require('./config/db-config.json');
const connection = mysql.createConnection({
  host     : db_config.host,
  user     : db_config.user,
  password : db_config.password,
  database : db_config.database
});

function data(id) {
    const url = "http://sshs.hs.kr/dggb/module/mlsv/selectMlsvDetailPopup.do?mlsvId="+id;
    const param = {};
    new Promise((resolve, reject) => {
        client.fetch(url, param, function(err, $, res) {
            if(err) { reject("ERROR!"); }
            else { resolve($); }
        });
    }).then(arg => {
        var query = "INSERT INTO Meal VALUES ("+id+',';
        arg('table > tbody > tr > td').each(idx => {
            if(idx >= 1 && idx <= 4) {
                query += '\''+arg(this).text().trim()+'\'';
                if(idx <= 3) { query += ','; }
            }
        });
        query += ')';
        connection.query(query);
    }).catch(arg => {
        console.log(arg);
    });
}

router.get('/api', (ctx, next) => {
    const {id} = ctx.request.query;
    connection.query("SELECT EXISTS (SELECT * FROM Meal WHERE id="+id+") AS SUCCESS", (err, results) => {
        if(err) { console.log("ERROR!!!"); }
        else { 
            if(results[0].success == 0) { data(id); }
            connection.query("SELECT * FROM Meal WHERE id="+id, (mealerr, mealresults) => {
                if(mealerr) { console.log("ERROR!!!"); }
                else { console.log(mealresults[0]); }
            });
        }
    });
})

app.use(router.routes()).use(router.allowedMethods());

app.listen(4000, () => {
    console.log("The Server Is Listening At Port 4000");
});