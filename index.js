require('dotenv').config();

const path = require('path');
const express = require('express');
const { Sequelize } = require('sequelize');

const app = express();
const sequelize = new Sequelize(process.env.DB_URI);

const Point = require('./models/Point')(sequelize);

sequelize
  .authenticate()
  .then(() => console.log('Connection has been established successfully.'))
  .catch(err => console.error('Unable to connect to the database:', err));

app.use(express.static(path.join(__dirname, 'src/views')));
app.set('view engine', 'ejs');

app.get('/', async (req, res) => {
  const points = await Point.findAll({ order: [sequelize.fn('RANDOM')], limit: 5 });
  res.render('index.ejs', { points: points.map(({ lat, lng }) => ({ lat, lng })) });
});

app.listen(3000, () => {
  console.log(`Listening on 3000`);
});

module.exports = sequelize;
