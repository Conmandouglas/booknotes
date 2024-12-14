import {} from 'dotenv/config';
import express from 'express';
import pg from 'pg';
import axios from 'axios'

const app = express();
const portRoute = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "bookreviews", 
  password: "ConnorD:0124",
  port: 5432,
});


const dbConnected = await db.connect().then(()=>true).catch(err => console.log(err))

app.listen(portRoute, () => {
  if(!dbConnected) {
    return console.log(`The application could not be started because the database is either offline or the connection information provided is invalid. Check the logs for details.`)
  }
  console.log(`App is running on ${portRoute}`);
});

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
    `SELECT r.id, r.title, r.details, r.rating, r.date, r.book_auth, r.thumb, u.name AS author 
     FROM reviews r 
     JOIN users u ON r.userid = u.id 
     ORDER BY r.id DESC;`
  );
  return result.rows;
}

app.get('/', async (req, res) => {
// what this needs to do:
// go through the openlibary API, get the book, then get the data, and cover API url for reach review in
// the result array
// what is happening:
// 

  const result = await checkReviews();

  for  (const review of result) {
    const title = review.title;
    const id = review.id;

    // check if whatever current item, and match it with reviews in database, see if it has link
    // if it does not have image link, then grab one from API and add it to column
    // after going through all books, then it will be done
    // if no image, make a special image show, a default one

    // review.id = id in table
    const checkThumbQuery = `
      SELECT thumb
      FROM reviews
      WHERE id = $1;
      `;

    const checkThumbResult = await db.query(checkThumbQuery, [id]);

    const currentThumb = checkThumbResult.rows[0]?.thumb;
    // then check if it has data in the thumb column
    if (!currentThumb) {
      let SEARCH_API_URL = process.env.SEARCH_API_URL;
      let COVER_ID_API_URL = process.env.COVER_ID_API_URL;
      let COVER_ISBN_API_URL = process.env.COVER_ISBN_API_URL;

      const searchTitle = title.replaceAll(' ', '+');
      SEARCH_API_URL = `${SEARCH_API_URL}${searchTitle}`.toLowerCase();

      const response = await axios.get(SEARCH_API_URL).catch(err => {
        console.log(err); return null;
      });

      if(!response || !response.data.docs || response.data.docs.length === 0) {
        console.log(`No data found for: ${title}`);
        continue;
      } 

      const bookData = response.data.docs[0];
      const cover_id = bookData?.cover_i;
      const isbn_data = bookData?.isbn[0];

      const COVER_API_URL = isbn_data
        ? COVER_ISBN_API_URL.replace('isbn_data', isbn_data)
        : COVER_ID_API_URL.replace('cover_id', cover_id);

      console.log(`Cover URL for ${title}: ${COVER_API_URL}`);

      // update thumb column in database
      const updateThumbQuery = `
        UPDATE reviews
        SET thumb = $1
        WHERE id = $2;
      `;
      await db.query(updateThumbQuery, [COVER_API_URL, id]);
    } else {
      console.log(`Thumb already exists for ${title}. Skipping API call.`);
    }

  }

  const reviewsList = await checkReviews();
  res.render("index.ejs", {
    listUser: "Connor",
    list: reviewsList,
    title: "Book Reviews",
  });
});

app.get('/add', async (req, res) => {
  res.render("modify.ejs", {
    title: "Write a Review"
  });
});

app.post('/add', async (req, res) => {
  try {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    let currentDate = `${month}/${day}/${year}`
    const result = await db.query(
      'INSERT INTO reviews (title, details, userid, rating, date, book_auth) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.body.title, req.body.details, 1, req.body.rating, currentDate, book_auth]
      // TO DO: 1 updates based on what user is selected
    );

    res.redirect('/');
  } catch (err) {
    console.log(err);
  }
});

app.get('/edit/:id', async (req, res) => {
  const reviewId = req.params.id;

  try {
    // TO DO: only go through if post userid is equal to current userid
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
    // TO DO: only go through if post userid is equal to current userid
    await db.query(
      'UPDATE reviews SET title = $1, details = $2, book_auth = $3, rating = $4 WHERE id = $5',
      [title, details, book_auth, rating, reviewId]
    );
    res.redirect('/');
  } catch (error) {
    console.error('Error updating reviews:', err);
    res.status(500).send('Internal Server Error');
  }
})

/*app.listen(port, () => {
  console.log(`App is running at http://localhost:${port}`);
});*/