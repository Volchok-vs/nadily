const express = require('express');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const FILE = 'parcels.json';

// создать файл если нет
if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify([]));
}

// получить участки
app.get('/parcels', (req, res) => {
    const data = fs.readFileSync(FILE);
    res.json(JSON.parse(data));
});

// сохранить участок
app.post('/save', (req, res) => {
    const parcel = req.body;

    const data = JSON.parse(fs.readFileSync(FILE));

    parcel.id = Date.now();
    data.push(parcel);

    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));

    res.json({status: 'ok'});
});

app.get('/', (req, res) => {
    res.send("Сервер працює 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server started"));
