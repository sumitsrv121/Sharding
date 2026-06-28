const app = require('express')();
const {Client} = require('pg');
const crypto = require("crypto");
const HashRing = require('hashring');
const hashRing = new HashRing();

hashRing.add("5432");
hashRing.add("5433");
hashRing.add("5434");

const clients = {
    "5432": new Client({
        "host": "localhost",
        "port": "5432",
        "user": "postgres",
        "password": "postgres",
        "database": "postgres"
    }),
    "5433": new Client({
        "host": "localhost",
        "port": "5433",
        "user": "postgres",
        "password": "postgres",
        "database": "postgres"
    }),
    "5434": new Client({
        "host": "localhost",
        "port": "5434",
        "user": "postgres",
        "password": "postgres",
        "database": "postgres"
    })
}

connect();

async function connect() {
    await clients["5432"].connect();
    await clients["5433"].connect();
    await clients["5434"].connect();
}


app.get("/:urlId", async (req, res) => {
    const urlId = req.params.urlId;
    const server = hashRing.get(urlId);
    
    const result = await clients[server].query("SELECT URL FROM URL_TABLE WHERE URL_ID = $1", [urlId]);
    if (result.rowCount > 0) {
        url = result.rows[0].url;
        res.send({
            urlId,
            url,
            server
        });
    } else {
        res.status(404).send({
            "message": `${urlId} not found`,
            server
        })
    } 
});

app.post("/", async (req, res) => {
    const url = req.query.url;

    const hash = crypto.createHash("sha256").update(url).digest("base64");
    const url_id = hash.substring(0, 5);
    const server = hashRing.get(url_id);
    await clients[server].query(
        "INSERT INTO URL_TABLE (URL, URL_ID) VALUES($1, $2)", [url, url_id]
    );

    res.send({
        url_id,
        url,
        server
    })
});

app.listen(3000, () => console.log("Server running on 3000"));

