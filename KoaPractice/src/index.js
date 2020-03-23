const Koa = require('koa');
const Router = require('koa-router');
const client = require('cheerio-httpcli');
const mysql = require('mysql');
const db_config  = require('./config/db-config.json');
const connection = mysql.createConnection({
  host     : db_config.host,
  user     : db_config.user,
  password : db_config.password,
  database : db_config.database
});

const app = new Koa();
const router = new Router();

function queryExec(sql) {
    return new Promise((resolve, reject) => {
        connection.query(sql, (err, res) => {
            err ? reject(err) : resolve(res);
        });
    });
}

function data(id) {
    return new Promise((resolve, reject) => {
        const url = `http://sshs.hs.kr/dggb/module/mlsv/selectMlsvDetailPopup.do?mlsvId=${id}`;
        const param = {};
        client.fetch(url, param, function(err, $, res) {
            err ? reject(err) : resolve($);
        });
    });
}

router.get('/api', async (ctx, next) => {
    const {id} = ctx.request.query;
    await queryExec("SELECT EXISTS (SELECT * FROM Meal WHERE id="+id+") AS SUCCESS").then(async results => {
        if(results[0].SUCCESS == 0) {
            await data(id).then(arg => {
                var query = "INSERT INTO Meal VALUES ("+id+',';
                arg('.ta_l').each(idx => {
                    if(idx >= 1 && idx <= 4) {
                        query += '\''+arg(this).text().trim()+'\'';
                        if(idx <= 3) { query += ','; }
                    }
                });
                query += ')';
                return queryExec(query);
            }).catch(err => {
                console.log("ERROR!!!");
            });
        }
        return queryExec(`SELECT * FROM Meal WHERE id=${id}`);
    }).then(arg => {
        ctx.body = arg[0].mdate;
    }).catch(err => {
        console.log("ERROR!!");
    });
    await next();
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(4000, () => {
    console.log("The Server Is Listening At Port 4000");
});