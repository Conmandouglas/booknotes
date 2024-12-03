import express from 'express';
import pg from 'pg';

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "bookreviews", 
  password: "ConnorD:0124",
  port: 5432,
});

db.connect();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(express.static("public"));

let reviews = [];
async function checkReviews() {
  // selecting reviews id, title, detils and user name (referenced as author)
  // FROM reviews r is the table we are retrieving data from
  // JOIN users u means we are joining with users and users is alised as u
  // ON is the condition, only is review user id is equal to users id
  // order by sorts by id in reviews table NEWEST first
  const result = await db.query(
    `SELECT r.id, r.title, r.details, u.name AS author 
     FROM reviews r 
     JOIN users u ON r.userid = u.id 
     ORDER BY r.id DESC;`
  );
  return result.rows;
}

app.get('/', async (req, res) => {
  try {
    // awaits data from function that gets the reviews
    const reviewsList = await checkReviews();
    // renders all reviews currently in database
    res.render("index.ejs", {
      listUser: "Connor",
      list: reviewsList,
      title: "Book Reviews"
    })
  } catch (err) {
    console.log("Error fetching items:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/add', async (req, res) => {
  res.render("modify.ejs", {
    title: "Write a Review"
  });
})

app.get('/edit/:id', async (req, res) => {
  const reviewId = req.params.id;

  try {
    const result = await db.query(
      'SELECT * FROM reviews WHERE id = $1', 
      [reviewId]);
    const review = result.rows[0];

    res.render('modify.ejs', {
      review: review,
      title: 'Edit Review'
    });
  } catch (err) {
    console.error('Error fetching review:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/edit/:id', async (req, res) => {
  const reviewId = req.params.id;
  const { title, details } = req.body;

  try {
    await db.query(
      'UPDATE reviews SET title = $1, details = $2 WHERE id = $3',
      [title, details, reviewId]
    );
    res.redirect('/');
  } catch (error) {
    console.error('Error updating reviews:', err);
    res.status(500).send('Internal Server Error');
  }
})

app.listen(port, () => {
  console.log(`App is running at http://localhost:${port}`);
});