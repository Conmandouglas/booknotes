import express from 'express';
import pg from 'pg';

const app = express();
const port = 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.get('/', (req, res) => {
  res.render(index.js);
});

app.listen(port, () => {
  console.log(`App is running at http://localhost:${port}`);
});